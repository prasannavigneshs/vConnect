import os
import mysql.connector
import json
import xlrd
from flask import Flask, render_template, request
from os.path import join, dirname, realpath

from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = join(dirname(realpath(__file__)), 'static/uploads/')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/add-staff', methods=["POST", "GET"])
def add_staffs():
    if request.method == "GET":
        return render_template("staff_signup.html")
    else:
        staff_id = request.form['staffid']
        name = request.form['name']
        department = request.form['department']
        designation = request.form.get('designation')
        file = request.files['profile_picture']
        flname = file.filename
        flname = flname.split('.')
        file.filename = staff_id + '.' + flname[-1]

        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        mysql_con = mysql.connector.connect(host="localhost", user="root", passwd="", database="vconnect")

        cursor = mysql_con.cursor()

        data = (staff_id, name, designation, filename, department)
        cursor.execute("INSERT INTO staffs_details VALUES (%s,%s,%s,%s,%s)", data)
        mysql_con.commit()
        return render_template("staff_signup.html", success=True)


@app.route('/upload-timetable', methods=["POST", "GET"])
def upload_timetable():
    if request.method == "GET":
        return render_template("upload_timetable.html")
    else:
        department = request.form['department']
        file = request.files['file']
        flname = file.filename
        flname = flname.split('.')
        file.filename = "timetable" + '.' + flname[-1]

        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        process_timetable(department, filename)

        return render_template("upload_timetable.html", success=True)


@app.route('/process-query', methods=['POST'])
def process_query():

    json_data = json.loads(request.form['data'])
    query_type = json_data['type']

    mysql_con = mysql.connector.connect(host="localhost", user="root", passwd="", database="vconnect")

    cursor = mysql_con.cursor()

    if query_type == "department_search":
        cursor.execute("SELECT department_name FROM departments")
        results = cursor.fetchall()
        details = []

        for result in results:
            details.append(result[0])

        return json.dumps({'type': 'result', 'value': details})

    elif query_type == "subject_search":
        cursor.execute("SELECT DISTINCT(subject_name) FROM staff_handling_subjects")
        results = cursor.fetchall()
        details = []
        for result in results:
            details.append(result[0])

        return json.dumps({'type': 'result', 'value': details})

    elif query_type == "free_period":
        cursor.execute("SELECT DISTINCT(class) FROM staff_handling_subjects")
        results = cursor.fetchall()
        details = []

        for result in results:
            details.append(result[0])

        return json.dumps({'type': 'result', 'value': details})

    elif query_type == "class":

        cursor.execute("SELECT DISTINCT(staff_id) FROM staff_handling_subjects "
                       "WHERE class = %s", (json_data['value'][0],))
        results = cursor.fetchall()
        details = []

        for result in results:
            cursor.execute("SELECT * FROM staffs_details WHERE id = %s", (result[0],))
            query2 = cursor.fetchall()
            cursor.execute("SELECT period FROM free_periods WHERE staff_id = %s", (result[0],))
            query3 = cursor.fetchall()
            json_result = json.loads(query3[0][0])
            if json_result[json_data['value'][1]][int(json_data['value'][2])] == "":
                staff = {'id': result[0], 'name': query2[0][1], 'designation': query2[0][2], 'image': query2[0][3]}
                details.append(staff)
        return json.dumps({'type': 'class', 'value': details})

    elif query_type == "department":
        cursor.execute("SELECT * FROM staffs_details WHERE department = %s", (json_data['value'],))
        results = cursor.fetchall()
        details = []

        for result in results:
            staff = {'id': result[0], 'name': result[1], 'designation': result[2], 'image': result[3]}
            details.append(staff)
        return json.dumps({'type': 'department', 'value': details})

    elif query_type == "subject":
        cursor.execute("SELECT * FROM staff_handling_subjects WHERE subject_name = %s", (json_data['value'],))
        results = cursor.fetchall()
        ids = []
        for result in results:
            ids.append(result[1])
        details = []

        for ID in ids:

            cursor.execute("SELECT * FROM staffs_details WHERE id = %s", (ID,))
            result = cursor.fetchone()
            staff = {'id': result[0], 'name': result[1], 'designation': result[2], 'image': result[3]}
            details.append(staff)
        return json.dumps({'type': 'subjects', 'value': details})


@app.route('/timetable/<arg>')
def display(arg):
    return render_template("timetable.html", id=arg)


@app.route('/load-from-db', methods=["POST"])
def load_from_db():
    mysql_con = mysql.connector.connect(host="localhost", user="root", passwd="", database="vconnect")

    cursor = mysql_con.cursor()

    cursor.execute("SELECT period FROM free_periods WHERE staff_id = %s", (request.form['data'],))

    result1 = cursor.fetchall()

    cursor.execute("SELECT subject_name, class FROM staff_handling_subjects "
                   "WHERE staff_id = %s", (request.form['data'],))

    result2 = cursor.fetchall()

    cursor.execute("SELECT staff_name FROM staffs_details WHERE id = %s", (request.form['data'],))

    result3 = cursor.fetchall()

    return json.dumps({"value": {"timetable": result1, "subjects": result2, "name": result3}})


def process_timetable(department, filename):
    book = xlrd.open_workbook(UPLOAD_FOLDER + filename)

    db = mysql.connector.connect(host="localhost", user="root", passwd="", database="vconnect")
    cursor = db.cursor()

    cursor.execute("DELETE FROM staff_handling_subjects WHERE staff_id IN "
                   "(SELECT id FROM staffs_details WHERE department = %s)", (department,))
    cursor.execute("DELETE FROM free_periods WHERE staff_id IN "
                   "(SELECT id FROM staffs_details WHERE department = %s)", (department,))

    db.commit()

    cnt = book.nsheets
    names = book.sheet_names()

    sa2 = names.index("SA2")

    for sheet_cnt in range(cnt):
        if sheet_cnt == sa2:
            continue
        sheet = book.sheet_by_index(sheet_cnt)
        print(sheet.name)
        ind = 0
        for cell in range(6, 15):
            if sheet.cell_value(cell, 1) == "DAY":
                ind = cell + 1
                break

        periods = {}

        for cell in range(5):
            day = []
            counter = 2

            while counter < 13:
                if sheet.cell_value(cell + ind, counter) != "":
                    day.append(sheet.cell_value(cell + ind, counter))

                elif counter == 4 or counter == 7 or counter == 10:
                    counter += 1
                    continue

                else:
                    day.append("")

                counter += 1

            periods[cell] = day

        for crange in sheet.merged_cells:
            rlo, rhi, clo, chi = crange
            if rlo >= ind and rlo < (ind + 5):
                ind_diff = 0
                if clo < 4:
                    ind_diff = 2
                elif clo >= 4 and clo < 7:
                    ind_diff = 3
                elif clo >= 7 and clo < 10:
                    ind_diff = 4
                else:
                    ind_diff = 5
                periods[rlo - ind][clo + 1 - ind_diff] = periods[rlo - ind][clo - ind_diff]

        cursor.execute("INSERT INTO free_periods VALUES (%s,%s)", (names[sheet_cnt], json.dumps(periods)))
        db.commit()

    sheet = book.sheet_by_index(sa2)
    name = ""

    for cell in range(5, sheet.nrows):

        if sheet.cell_value(cell, 1) != "":
            name = sheet.cell_value(cell, 1).strip()
        print(name)
        cursor.execute("SELECT id FROM staffs_details WHERE staff_name = %s", (name,))
        result = cursor.fetchall()
        row_id = result[0][0]

        if sheet.cell_value(cell, 4) != "":
            cursor.execute("INSERT INTO staff_handling_subjects (staff_id,subject_name,class) VALUES (%s,%s,%s)",
                           (row_id, sheet.cell_value(cell, 2),
                            sheet.cell_value(cell, 4) + " " + sheet.cell_value(cell, 3)))
            db.commit()

        if sheet.cell_value(cell, 6) != "" and "NA" not in sheet.cell_value(cell, 6):
            cursor.execute("INSERT INTO staff_handling_subjects (staff_id,subject_name,class) VALUES (%s,%s,%s)",
                           (row_id, sheet.cell_value(cell, 6),
                            sheet.cell_value(cell, 8) + " " + sheet.cell_value(cell, 7)))
            db.commit()


if __name__ == "__main__":
    app.secret_key = os.urandom(12)
    app.run(host='0.0.0.0', debug=True, threaded=True)
