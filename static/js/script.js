var flag = true, element, fields, day, text;

function validateFileExtension() {
    var filename = document.getElementById('staff_timetable').value;
    var extension = filename.substring(filename.lastIndexOf('.') + 1);

    if(extension === "xls" || extension === "xlsx") {

        filename = document.getElementById('class_timetable').value;
        extension = filename.substring(filename.lastIndexOf('.') + 1);
        
        if(extension === "xls" || extension === "xlsx" || extension === "") {
            document.getElementById('uploading').style.display = "block";
            return true;
        }
        else {
            element = document.getElementById('feedback_class').style;
            element.display = "";
            element.color = "red";
            return false;
        }
    }
    else {
        element = document.getElementById('feedback_staff').style;
        element.display = "";
        element.color = "red";
        return false;
    }
    
}


function invoke() {
    getResults(document.getElementById('day').value, document.getElementById('period').value);
}

function getFields(value) {
    var request = new XMLHttpRequest();
    var doc = "", dataList;
    if(value === undefined) {
        if(document.getElementById('after').style.display === "") {
            doc = document.getElementById('search_query').value;
            dataList = document.getElementById('data_list');
            dataList.innerHTML ="";
            document.getElementById('search_bar').value = "";
        }
        else {
            doc = document.getElementById('searchquery').value;
            dataList = document.getElementById('datalist');
            dataList.innerHTML ="";
            document.getElementById('searchbar').value = "";
        }
    }
    else {
        doc = value;
        dataList = document.getElementById('data_list');
        dataList.innerHTML ="";
    }
    var data = {};
    fields = ["department_search","subject_search","free_period","class_search","staff_search"];
    data["type"]=fields[parseInt(doc)];

    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          var jsonOptions = JSON.parse(request.responseText);
          jsonOptions['value'].forEach(function(item) {
            var option = document.createElement('option');
            option.value = item;
            dataList.appendChild(option);
          });
        }
      }
    };


    request.open('POST', '/process-query', true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send("data="+JSON.stringify(data));
}

function getResults(field1, field2) {
    var request = new XMLHttpRequest();
    var doc = "", val = "";
    if(document.getElementById('after').style.display === "") {
        doc = document.getElementById('search_query').value;
        val = document.getElementById('search_bar').value;
        if(doc === "" || val === "") {
            document.getElementById('error').click();
            return false;
        }
    }
    else {
        doc = document.getElementById('searchquery').value;
        val = document.getElementById('searchbar').value;
        if(doc === "" || val === "") {
            document.getElementById('error').click();
            return false;
        }
    }
    var data = {};
    fields = ["department", "subject", "class", "sections", "staff"];
    data["type"]=fields[parseInt(doc)];
    if(data["type"] === "class") {
        if(field1 === undefined) {
            document.getElementById('trigger').click();
            return;
        }
        else
            data["value"] = [val, field1,field2];
    } else {
        data["value"] = val;
    }
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          var jsonOptions = JSON.parse(request.responseText);
          document.getElementById('before').style.display = "none";
          document.getElementById('after').style.display = "";
          if(!flag) {
                document.getElementById('search_query').value = document.getElementById('search_query').value;
                document.getElementById('search_bar').value = document.getElementById('search_bar').value;
          } else {
                flag = false;
                document.getElementById('search_query').value = document.getElementById('searchquery').value;
                getFields();
                document.getElementById('search_bar').value = document.getElementById('searchbar').value;
          }
          fillProfiles(jsonOptions['value'], data["type"]);
        }
      }
    };


    request.open('POST', '/process-query', true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send("data="+JSON.stringify(data));

}

function fillProfiles(data, type) {
    var text = "";
    if(type !== "sections") {
        for(i = 0; i < data.length; i ++ ) {
            text += '<div class="staff-detail col-xd-3 col-sm-3 col-md-3">' +
            '<center>'+
                '<a href="/timetable/' + data[i]['id'] + '" target="_blank">'+
                    '<div class = "profile_picture">'+
                        '<img  class="rounded-circle " src="/static/uploads/' + getImageName(data[i]['name']) + '.jpg" alt="image" height="200" width="200">'+
                    '</div>'+
                '</a>'+
                '<div class="details">'+
                    '<h5> <p class="name">' +  data[i]['name'] + '</p></h5>'+
                    '<p class="designation">' + data[i]['designation'] + '</p>'+
                    '<button class="btn btn-primary" onclick=" window.open(\'/timetable/' + data[i]['id'] + '\',\'_blank\')"> View TimeTable</button>' +
                '</div>'+
            '</center>'+
        '</div>';
        }
    } else {
        for(var i = 0; i < data.length; i ++ ) {
            text += '<div class="staff-detail col-xd-3 col-sm-3 col-md-3">' +
            '<center>'+
                '<a href="/class-timetable/' + data[i]['id'] + '" target="_blank">'+
                    '<div class = "profile_picture">'+
                        '<img  class="rounded-circle " src="/static/uploads/' + getImageName(data[i]['class']) + '.jpg" alt="image" height="200" width="200">'+
                    '</div>'+
                '</a>'+
                '<div class="details">'+
                    '<h5> <p class="name">' +  data[i]['class'] + '</p></h5>'+
                    '<a href="/class-timetable/' + data[i]['id'] + '" type="button" class="btn btn-info" target="_blank">View Timetable</button>'+
                '</div>'+
            '</center>'+
        '</div>';
        }
    }
    document.getElementById('profiles').innerHTML = text;
}

function loadStaffTimetable(id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            var result = JSON.parse(json['value']['timetable'][0]);
            var subjects = json['value']['subjects'];
            var subject = '<center><table class="table" style="margin-top:3%;width:40%"> <tr><th class="col-md-1"> Name of the faculty </th> <th class="col-md-1">' + json['value']['name'][0][0] + '</th></tr>' ;

            for(var k = 0; k < subjects.length; k++) {
                subject += '<tr><td class="col-md-1">' + subjects[k][0] + '</td>';
                subject += '<td class="col-md-1">' + subjects[k][1] + '</td></tr>';
            }
            subject += '</table></center>';
            document.getElementById('subjects').innerHTML = subject;

            day = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
            text = "<table border='2'>";
            for(var i = 0 ;i < 5; i++)
            {
                text+='<tr>';
                text+= '<th scope="row">'+day[i]+'</th>';
                for(var j= 0 ; j < 8; j++) {
                        if(result[i][j]==="")
                            text+='<td>     </td>';
                        else if ((j%2 === 0) && result[i][j] === result[i][j + 1]) {
                            text+='<td colspan="2" align="center">'+result[i][j]+'</td>';
                             j++;
                        }
                        else
                            text+='<td align="center">'+result[i][j]+'</td>';
                }

                text+='</tr>';
            }
            text+='</table>';
            document.getElementById('rows').innerHTML = text;
        }
    };

    xhttp.open("POST", "/load-from-db", false);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    try {
        xhttp.send("type=staff&data="+id);
    } catch(err) {
        alert("Oops send");
    }

}

function loadClassTimetable(id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState ===4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            var result = JSON.parse(json['value']['timetable']);
            var detail = '<center>' +
                        '<table class="table" style="margin-top:3%;width:40%">' +
                            '<tr>' +
                                '<th class="col-md-1" style="width:50%" > Class </th>' +
                                '<td class="col-md-1">' + json['value']['details'][0] + '</td>' +
                            '</tr>' +
                            '<tr>' +
                                '<th class="col-md-1" style="width:50%"> Class Advisor </th>' +
                                '<td class="col-md-1">' + json['value']['details'][1] + '</td>' +
                            '</tr>' +
                        '</table>' +
                      '</center>';
            document.getElementById('details').innerHTML = detail;

            day = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
            text = "<table border='2'>";
            for(var i = 0 ;i < 5; i++)
            {
                text+='<tr>';
                text+= '<th scope="row">'+day[i]+'</th>';
                for(var j= 0 ; j < 8; j++) {
                        if(result[i][j]==="")
                            text+='<td>     </td>';
                        else if ((j%2 === 0) && result[i][j] === result[i][j + 1]) {
                            text+='<td colspan="2" align="center">'+result[i][j]+'</td>';
                             j++;
                        }
                        else
                            text+='<td align="center">'+result[i][j]+'</td>';
                }

                text+='</tr>';
            }
            text+='</table>';
            document.getElementById('rows').innerHTML = text;

            var subject_details = JSON.parse(json['value']['subject_details']);
            var subject_detail = '<center>' +
                        '<table class="table" style="width:60%">' +
                            '<tr>' +
                                '<th class="col-md-3" style="width:20%"> Subject Code </th>' +
                                '<th class="col-md-3"> Subject Name </th>' +
                                '<th class="col-md-3"> Faculty </th>' +
                            '</tr>' ;
            for(i = 0; i < subject_details.length; i ++) {
                subject_detail += '<tr>' +
                        '<td class="col-md-3" style="width:20%">' + subject_details[i]["code"] + '</th>' +
                        '<td class="col-md-3">' + subject_details[i]["subject"] + '</th>' +
                        '<td class="col-md-3">' + subject_details[i]["faculty"] + '</th>' +
                    '</tr>';
            }
            subject_detail += '</table></center>';

            document.getElementById('subject_details').innerHTML = subject_detail;
        }
    };

    xhttp.open("POST", "/load-from-db", false);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    try {
        xhttp.send("type=class&data="+id);
    } catch(err) {
        alert("Oops send");
    }

}

function departmentDetails(value) {
    var xhttp = new XMLHttpRequest();
    if(value == 0) {
        xhttp.onreadystatechange = function() {
            if(this.readyState ===4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                text = "";
                for(i = 0; i < json["value"].length; i ++) {
                    text += '<tr>' +
                                '<td>' + json["value"][i]["code"] + '</td>' +
                                '<td>' + json["value"][i]["name"] + '</td>' +
                                '<td><button class="btn btn-danger btn-sm" onclick="removeData(\'dept\', this)"><i class="fa fa-trash" aria-hidden="true"></i> Delete</button></td>' +
                             '</tr>';
                }
                document.getElementById('department_details').innerHTML = text;
            }
        };

        xhttp.open("POST", "/department-details", false);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        try {
            xhttp.send("type=read");
        } catch(err) {
            alert("Oops send");
        }
    } else {
        var code = document.getElementById("departmentcode").value;
        var name = document.getElementById("departmentname").value;
        if(code === "" || name === "") {
            window.alert("Fill all fields");
            return;
        }
        xhttp.onreadystatechange = function() {
            if(this.readyState ===4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                text = '<tr>' +
                            '<td>' + json["value"]["code"] + '</td>' +
                            '<td>' + json["value"]["name"] + '</td>' +
                            '<td><button class="btn btn-danger btn-sm" onclick="removeData(\'dept\', this)"><i class="fa fa-trash" aria-hidden="true"></i> Delete</button></td>' +
                        '</tr>';

                document.getElementById('department_details').innerHTML += text;
            }
        };

        xhttp.open("POST", "/department-details", false);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        try {
            xhttp.send("type=write&code=" + code + "&name=" + name);
        } catch(err) {
            alert("Oops send");
        }
    }
}

function removeData(type, element) {
    var xhttp = new XMLHttpRequest();
    var parentElement = element.parentNode.parentNode;
    var key = parentElement.childNodes[0].innerHTML;
    console.log(key);
    xhttp.onreadystatechange = function() {
        if(this.readyState ===4 && this.status === 200) {
            var text = this.responseText;
            var ultimateParent = parentElement.parentNode;
            ultimateParent.removeChild(parentElement);
        }
    };

    xhttp.open("POST", "/department-details", false);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    try {
        xhttp.send("type=delete&of=" + type + "&data=" + key);
    } catch(err) {
        alert(err);
    }

}

function staffDetails(value, data) {
    var xhttp = new XMLHttpRequest();
    if(value === "load") {
        xhttp.onreadystatechange = function() {
            if(this.readyState ===4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                text = "";
                for(i = 0; i < json["value"].length; i ++) {
                    text += '<tr>' +
                                '<td>' + json["value"][i]["id"] + '</td>' +
                                '<td>' + json["value"][i]["name"] + '</td>' +
                                '<td>' + json["value"][i]["designation"] + '</td>' +
                                '<td>'+
                                    '<button class="btn btn-warning btn-sm" style="margin-right:10px" onclick="staffDetails(\'edit\',this)"><i class="fa fa-pencil" aria-hidden="true"></i> Edit</button>&nbsp' +
                                    '<button class="btn btn-danger btn-sm" onclick="removeData(\'staff\', this)"><i class="fa fa-trash" aria-hidden="true"></i> Delete</button>' +
                                '</td>' +
                             '</tr>';
                }
                document.getElementById('staff_details').innerHTML = text;
            }
        };

        xhttp.open("POST", "/department-details", false);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        try {
            xhttp.send("type=load&data=" + data);
        } catch(err) {
            alert("Oops send");
        }
    } else if(value === "edit") {
        var parentElement = data.parentNode.parentNode;
        text = '<td>' + parentElement.childNodes[0].innerHTML + '</td>' +
               '<td> <input type="text" class="form-control" id="name" value="' + parentElement.childNodes[1].innerHTML + '"></td>' +
               '<td> <select class="form-control" id="designation" required>' +
                                    '<option value="' + parentElement.childNodes[2].innerHTML + '" selected disabled>' + parentElement.childNodes[2].innerHTML + '</option>' +
                                    '<option value="Professor & Head">Professor & Head</option>' +
                                    '<option value="Professor">Professor</option>' +
                                    '<option value="Associate Professor">Associate Professor</option>' +
                                    '<option value="Assistant Professor-III">Assistant Professor-III</option>' +
                                    '<option value="Assistant Professor-II">Assistant Professor-II</option>' +
                                    '<option value="Assistant Professor-I">Assistant Professor-I</option>' +
                    '</select>' +
               '</td>' +
               '<td>'+
                   '<button class="btn btn-success btn-sm" style="margin-right:10px" onclick="staffDetails(\'save\',this)"><i class="fa fa-check" aria-hidden="true"></i> Save</button>&nbsp' +
                   '<button class="btn btn-danger btn-sm" onclick="removeData(\'staff\', this)"><i class="fa fa-trash" aria-hidden="true"></i> Delete</button>' +
               '</td>';
        parentElement.innerHTML = text;

    } else if(value === "save") {
        var parentElement = data.parentNode.parentNode;
        var id = parentElement.childNodes[0].innerHTML;
        var name = document.getElementById('name').value;
        var designation = document.getElementById('designation').value;

        xhttp.onreadystatechange = function() {
            if(this.readyState ===4 && this.status === 200) {
                text = '<td>' + id + '</td>' +
                   '<td>' + name + '</td>' +
                   '<td>' + designation + '</td>' +
                   '<td>'+
                       '<button class="btn btn-warning btn-sm" style="margin-right:10px" onclick="staffDetails(\'edit\',this)"><i class="fa fa-pencil" aria-hidden="true"></i> Edit</button>&nbsp' +
                       '<button class="btn btn-danger btn-sm" onclick="removeData(\'staff\', this)"><i class="fa fa-trash" aria-hidden="true"></i> Delete</button>' +
                   '</td>';
                parentElement.innerHTML = text;
            }
        };

        xhttp.open("POST", "/department-details", false);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        try {
            xhttp.send("type=edit&data=" + JSON.stringify({"id": id, "name": name, "designation": designation}));
        } catch(err) {
            alert("Oops send");
        }

    }
}

function getImageName(name) {
    if(name.includes("Dr"))
        return "doc";
    else if(name.includes("Mrs") || name.includes("Ms"))
        return "female";
    else if(name.includes("Mr"))
        return "male";
    else
        return "classroom";
}