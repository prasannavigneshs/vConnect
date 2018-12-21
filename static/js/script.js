var flag = true;

function validateFileExtension() {
    var filename = document.getElementById('file').value;
    var extension = filename.substring(filename.lastIndexOf('.') + 1);

    if(extension === "xls" || extension === "xlsx") {
        return true;
    }
    else {
        element = document.getElementById('feedback').style;
        element.display = "";
        element.color = "red";
        return false;
    }
    return false;
}


function invoke() {
    getResults(document.getElementById('day').value, document.getElementById('period').value);
}

function getFields(value) {
    var request = new XMLHttpRequest();
    var doc = "", datalist = "";
    if(value == undefined) {
        if(document.getElementById('after').style.display == "") {
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
        doc = parseInt(value);
        dataList = document.getElementById('data_list');
        dataList.innerHTML ="";
    }
    var data = {};
    fields = ["department_search","subject_search","free_period"]
    data["type"]=fields[parseInt(doc)];

    request.onreadystatechange = function(response) {
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
    fields = ["department","subject","class"]
    data["type"]=fields[parseInt(doc)];
    if(data["type"] === "class") {
        if(field1 == undefined) {
            document.getElementById('trigger').click();
            return;
        }
        else
            data["value"] = [val, field1,field2];
    } else {
        data["value"] = val;
    }
    request.onreadystatechange = function(response) {
      if (request.readyState === 4) {
        if (request.status === 200) {
          var jsonOptions = JSON.parse(request.responseText);
          document.getElementById('before').style.display = "none";
          document.getElementById('after').style.display = "";
          if(!flag) {
                document.getElementById('search_query').value =document.getElementById('search_query').value;
                document.getElementById('search_bar').value = document.getElementById('search_bar').value;
          } else {
                flag = false;
                document.getElementById('search_query').value = document.getElementById('searchquery').value;
                getFields();
                document.getElementById('search_bar').value = document.getElementById('searchbar').value;
          }
          fillProfiles(jsonOptions['value']);
        }
      }
    };


    request.open('POST', '/process-query', true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send("data="+JSON.stringify(data));

}

function fillProfiles(data) {
    var text = "";
    for(var i = 0; i < data.length; i ++ ) {
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
                '<a href="/timetable/' + data[i]['id'] + '" type="button" class="btn btn-info" target="_blank">View Timetable</button>'+
            '</div>'+
        '</center>'+
    '</div>';
    }
    document.getElementById('profiles').innerHTML = text;
}

function loadValueFromDb(id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState ===4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            var result = JSON.parse(json['value']['timetable'][0]);
            subjects = json['value']['subjects'];
            subject = '<center><table class="table" style="margin-top:3%;width:40%"> <tr><th class="col-md-1"> Name of the faculty </th> <th class="col-md-1">' + json['value']['name'][0][0] + '</th></tr>' ;

            for(var k = 0; k < subjects.length; k++) {
                subject += '<tr><td class="col-md-1">' + subjects[k][0] + '</td>';
                subject += '<td class="col-md-1">' + subjects[k][1] + '</td></tr>';
            }
            subject += '</table></center>';
            document.getElementById('subjects').innerHTML = subject;

            day = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]
            text = "<table border='2'>";
            for(var i = 0 ;i < 5; i++)
            {
                text+='<tr>';
                text+= '<th scope="row">'+day[i]+'</th>';
                for(var j= 0 ; j < 8; j++) {
                        if(result[i][j]==="")
                            text+='<td>     </td>';
                        else if ((j%2 == 0) && result[i][j] === result[i][j + 1]) {
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
        xhttp.send("data="+id);
    } catch(err) {
        alert("Oops send");
    }

}

function getImageName(name) {
    if(name.includes("Dr"))
        return "doc";
    else if(name.includes("Mrs") || name.includes("Ms"))
        return "female";
    return "male";
}