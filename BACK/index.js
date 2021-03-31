const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
var stemmer = require("porter-stemmer").stemmer;
var Stack = require("stackjs");
var stack = new Stack();
const app = express();
const Router = express.Router();

//Global variables
var stopwords = [];
var prefixquery = [];
var resultdoc = [];
var positionalindex = {};
var invertedindex = {};
var alldoc = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
];
global.str = "";
app.use(cors());
app.use(logger(`dev`));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use(
  Router.get("/getResult", async (req, res) => {
    let query = req.query.query;
    let type = req.query.type;

    //loading of inverted-index from directory if already present
    async function filechecking1() {
      //if inverted-index is not in directory then create it
      fs.readFile("./Files/inverted.txt", (err, data) => {
        if (err) {
          indexing(); //creation of new inverted index if not in directory
        } else {
          invertedindex = JSON.parse(data);
        }
      });
    }

    //loading of positional-index from directory if already present

    function filechecking2() {
      fs.readFile("./Files/positional.txt", (err, data) => {
        if (err) {
          indexing(); //creation of new positional index if not in directory
        } else {
          positionalindex = JSON.parse(data);
        }
      });
    }
    //loading of stop words in to the list
    var path = "./Files/Stopword-List.txt";
    var stdata = fs.readFileSync(path, "utf8").split("\n");

    for (var i = 0; i < stdata.length; i++) {
      temp = stdata[i].replace("\r", "").replace(" ", "").toString();
      stopwords.push(temp);
    }
    //calling of file creation method
    filechecking1();
    filechecking2();

    setTimeout(() => {
      query = query.trim(); //removing extra whitespace from query
      query = query.replace("/", "/ ");
      query = query.split(" ");

      //stemming of user input query
      for (var i = 0; i < query.length; i++) {
        query[i] = stemmer(query[i]);
      }

      //function calling and exception handling  
      if (query.includes("/") == true && type == "proximity") {
        resultdoc = proximityQuery(query);
        return res.status(200).json(resultdoc);
      } else if (query.includes("/") == true && type != "proximity") {
        return res.status(200).json("Please Select Correct Query Type");
      } else if (query.includes("(") == true && query.includes(")") == true) {
        console.log(complexQuery(query));
      } else if (
        type != "boolean" &&
        (query.includes("and") == true ||
          query.includes("or") == true ||
          query.includes("not") == true)
      ) {
        return res.status(200).json("Please Select Correct Query Type ");
      } else if (
        type != "boolean" &&
        query.includes("and") == false &&
        query.includes("or") == false &&
        query.includes("not") == false &&
        query.includes(" ") == false
      ) {
        return res.status(200).json("Please Select Correct Query Type");
      } else {
        resultdoc = booleanQuery(query);
        return res.status(200).json(resultdoc);
      }
    }, 6000);

    //Proximity Query Solution
    function proximityQuery(query) {
      let a = query[0];
      let b = query[1];
      let distance = Number(query[3]);

      //fetching document ids of term 1 and term 2
      let d1 = Object.keys(positionalindex[a]);
      let d2 = Object.keys(positionalindex[b]);

    //common documents ids of term 1 and term 2
      let intersection = d1.filter((x) => d2.includes(x));
      
    //collection of valid documents ids
      let resultdoc = [];
      for (var i = 0; i < intersection.length; i++) {
        var p1 = positionalindex[a][intersection[i]];
        var p2 = positionalindex[b][intersection[i]];

        if (p1.length < p2.length) {
          for (var j = 0; j < p2.length; j++) {
            for (var k = 0; k < p1.length; k++) {
              if (p2[j] - p1[k] == distance + 1) {
                resultdoc.push(Number(intersection[i]));
              }
            }
          }
        } else {
          for (var j = 0; j < p1.length; j++) {
            for (var k = 0; k < p2.length; k++) {
              if (p2[k] - p1[j] == distance + 1) {
                resultdoc.push(intersection[i]);
              }
            }
          }
        }
      }
      resultdoc = [...new Set(resultdoc)];

      return resultdoc;
    }

    function booleanQuery(query) {
      //single word query
      if (
        query.includes("or") == false &&
        query.includes("not") == false &&
        query.includes("and") == false &&
        query.includes('" "') == false
      ) {
        resultdoc = invertedindex[query[0]];
        return resultdoc;
      }

      // AND operator query identification and solution
      else if (
        query.includes("or") == false &&
        query.includes("not") == false &&
        query.includes("and") == true
      ) {
        //means 2 words --> play and god
        if (query.length == 3) {

          
      //if term is present in the index fetch doc ids
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }

      //if term is present in the index fetch doc ids
          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }

          //ANDING of both list
          let intersection = andList(list1, list2);
          return intersection;
        }
        //means 3 words --> play and god and king
        else if (query.length == 5) {
          
      //if term is present in the index fetch doc ids
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }

      //if term is present in the index fetch doc ids
          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }

          if (invertedindex[query[4]] != undefined) {
            var list3 = invertedindex[query[4]];
          } else {
            list3 = [];
          }

          var intersection = andList(list1, list2);
          resultdoc = andList(intersection, list3);
          return resultdoc;
        }
      }
      //And query ends

      // OR operator query identification and solution
      else if (
        query.includes("and") == false &&
        query.includes("not") == false
      ) {
        console.log("all or");

        //2 words query -->god or play
        if (query.length == 3) {
          
      //if term is present in the index fetch doc ids
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }
          
      //if term is present in the index fetch doc ids
          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }
          //ORING of both list
          resultdoc = orList(list1, list2);
          return resultdoc;
        }

        // 3 words query -->god or play or king
        else if (query.length == 5) {
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }

      //if term is present in the index fetch doc ids
          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }

          if (invertedindex[query[4]] != undefined) {
            var list3 = invertedindex[query[4]];
          } else {
            list3 = [];
          }
          //ORING of LIST
          resultdoc = orList(list1, list2);
          resultdoc = orList(list3, resultdoc);
        }
      }
      //Or query ends

      //And Or Query Identification and solution
      else if (
        query.includes("and") == true &&
        query.includes("or") == true &&
        query.includes("not") == false
      ) {
        //a and b or c
        if (query[1] == "and" && query[3] == "or" && query.length == 5) {
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }

          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }

          if (invertedindex[query[4]] != undefined) {
            var list3 = invertedindex[query[4]];
          } else {
            list3 = [];
          }

          let merge = orList(list2, list3);

          resultdoc = andList(merge, list1);

          return resultdoc;
        }

        //a or b and c
        if (query[1] == "or" && query[3] == "and" && query.length == 5) {
          if (invertedindex[query[0]] != undefined) {
            var list1 = invertedindex[query[0]];
          } else {
            list1 = [];
          }

          if (invertedindex[query[2]] != undefined) {
            var list2 = invertedindex[query[2]];
          } else {
            list2 = [];
          }

          if (invertedindex[query[4]] != undefined) {
            var list3 = invertedindex[query[4]];
          } else {
            list3 = [];
          }

          let merge = orList(list1, list2);
          resultdoc = andList(merge, list3);

          return resultdoc;
        }
      }
      //And Or Query ends

      //all combination queries
      else {
        priority = {};
        priority["and"] = 1;
        priority["or"] = 2;
        priority["not"] = 3;
        listno = null;
        let list1 = [];
        let list2 = [];
        let list3 = [];

        //formation of stack to convert query in postfix order
        for (var x = 0; x < query.length; x++) {
          if (query[x] == "and" || query[x] == "or" || query[x] == "not") {
            while (
              stack.size() != 0 &&
              priority[stack.peek()] >= priority[query[x]]
            ) {
              prefixquery.push(stack.pop());
            }

            stack.push(query[x]);
          } else {
            prefixquery.push(query[x]);
          }
        }

        while (stack.size() != 0) {
          prefixquery.push(stack.pop());
        }

        query = prefixquery;

        for (var i = 0; i < query.length; i++) {
          if (query[i] == "and" || query[i] == "or" || query[i] == "not") {
            if (query[i] == "not") {
              if (listno == 1) {
                list1 = notList(list1);
              } else if (listno == 2) {
                list2 = notList(list2);
              } else if (listno == 3) {
                list3 = notList(list3);
              }
            } else if (query[i] == "and") {
              if (listno == 2) {
                list2 = andList(list1, list2);
              } else if (listno == 3) {
                list3 = andList(list2, list3);
              }
            } else if (query[i] == "or") {
              if (listno == 2) {
                list2 = orList(list1, list2);
              } else if (listno == 3) {
                list3 = orList(list2, list3);
              }
            }
          } else {
            if (list1.length == 0) {
              if (invertedindex[query[i]] != undefined) {
                list1 = invertedindex[query[i]];
                listno = 1;
              } else {
                list1 = [];
                listno = 1;
              }
            } else if (list2.length == 0) {
              //
              if (invertedindex[query[i]] != undefined) {
                list2 = invertedindex[query[i]];
                listno = 2;
              } else {
                list2 = [];
                listno = 2;
              }
            } else if (list3.length == 0) {
              if (invertedindex[query[i]] != undefined) {
                list3 = invertedindex[query[i]];
                listno = 3;
              } else {
                list3 = [];
                listno = 3;
              }
            }
          }
        }

        if (listno == 1) {
          resultdoc = list1;
          return resultdoc;
        } else if (listno == 2) {
          resultdoc = list2;
          return resultdoc;
        } else if (listno == 3) {
          resultdoc = list3;
          return resultdoc;
        }
      }
    }

    //Helper OR funtion
    function orList(list1, list2) {
      let merge = list1.concat(list2).sort();

      merge = [...new Set(merge)];
      merge = merge.sort(function (a, b) {
        return a - b;
      });

      return merge;
    }
    //Helper AND funtion
    function andList(list1, list2) {
      let intersection = list1.filter((x) => list2.includes(x));
      return intersection;
    }
    //Helper Not function
    function notList(list) {
      let notlist = alldoc.filter((x) => !list.includes(x));
      return notlist;
    }
    //NOT operator query ends
    
    //Complex Query Handling consist of brackets
    function complexQuery(query) {
      //not (a or b) and c  && not (a or b) or c && not (a and b) and c && not (a and b) or c
      if (query[0] == "not" && query[1] == "(" && query.length == 8) {
        sub = booleanQuery(
          query.slice(query.indexOf("(") + 1, query.indexOf(")"))
        );
        sub = notList(sub);

        if (query[6] == "and") {
          temp = andList(sub, invertedindex[query[7]]);
          return temp;
        } else if (query[6] == "or") {
          temp = orList(sub, invertedindex[query[7]]);
          return temp;
        }
      }
      //(a or b) or c && (a or b) and c && (a and b) or c && (a and b) and c
      else if (query[0] == "(" && query.length == 7) {
        sub = booleanQuery(
          query.slice(query.indexOf("(") + 1, query.indexOf(")"))
        );

        if (query[5] == "or") {
          resultdoc = orList(sub, invertedindex[query[6]]);
          return resultdoc;
        } else if (query[5] == "and") {
          resultdoc = andList(sub, invertedindex[query[6]]);
          return resultdoc;
        }
      }
      //a and (b or c) && a or (b and c)
      else if (query[2] == "(" && query.length == 7) {
        sub = booleanQuery(
          query.slice(query.indexOf("(") + 1, query.indexOf(")"))
        );

        if (query[1] == "and") {
          resultdoc = andList(sub, invertedindex[query[0]]);
          return resultdoc;
        } else if (query[1] == "or") {
          resultdoc = orList(sub, invertedindex[query[0]]);
          return resultdoc;
        }
      }
    }

    function indexing() {
      for (var i = 1; i <= 50; i++) {
        //Reading text file and store in data array
        data = [];
        var filepath = "./Files/";
        var filename = filepath + i.toString() + ".txt";
        var data = fs.readFileSync(filename, "utf8").split("\n");
        //removing extra space b/w lines and token making process
        data = data
          .toString()
          .toLowerCase()
          .replace(/[\n\r]+/g, " ")
          .replace(",", "");
        data = data.split(" ");
        //removing of extra character from token
        for (j = 1; j < data.length; j++) {
          var temp = data[j]
            .replace(",", "")
            .replace(".", "")
            .replace(" ", "")
            .replace("\n", "")
            .replace("?", "")
            .replace("!", "")
            .replace(",", "")
            .replace("]", "")
            .replace("[", "")
            .replace("-", " ")
            .replace("’s", "")
            .replace("''", "")
            .replace(";", "")
            .replace("''", "")
            .replace("——", "")
            .replace("—", "")
            .replace(":", "")
            .replace("n’t", " not")
            .replace("\n", "")
            .replace("’ll", "will")
            .replace("’m", " am")
            .replace(/“/g, "")
            .replace(/”/g, "")
            .replace(/‘/g, "")
            .replace(/’/g, "")
            .replace(/''/g, "")
            .replace("(", "")
            .replace(")", "")
            .toLowerCase();
          temp = stemmer(temp);
          //if the token is from stopword list then don't include it in inverted index
          if (invertedindex[temp] === undefined) {
            var arr = [i];
            if (stopwords.includes(temp) == false) {
              invertedindex[temp] = arr;
            }
          } else {
            var arr = invertedindex[temp];
            arr.push(i);
            arr = [...new Set(arr)];
            invertedindex[temp] = arr;
          }
        }
      }
      fs.writeFileSync("./Files/inverted.txt", JSON.stringify(invertedindex));

      //Positional Index Creation

      for (var i = 1; i <= 50; i++) {
        var filepath = "./Files/";
        var filename = filepath + i.toString() + ".txt";
        var data = fs.readFileSync(filename, "utf8").split("\n");
        data = data
          .toString()
          .toLowerCase()
          .replace(/[\n\r]+/g, " ")
          .replace(",", "");
        data = data.split(" ");

        //removing of extra character from token
        for (j = 0; j < data.length; j++) {
          var temp = data[j]
            .replace(",", "")
            .replace(".", "")
            .replace(" ", "")
            .replace("\n", "")
            .replace("?", "")
            .replace("!", "")
            .replace(",", "")
            .replace("]", "")
            .replace("[", "")
            .replace("-", " ")
            .replace("’s", "")
            .replace("''", "")
            .replace(";", "")
            .replace("''", "")
            .replace("——", "")
            .replace("—", "")
            .replace(":", "")
            .replace("n’t", " not")
            .replace("\n", "")
            .replace("’ll", "will")
            .replace("’m", " am")
            .replace(/“/g, "")
            .replace(/”/g, "")
            .replace(/‘/g, "")
            .replace(/’/g, "")
            .replace(/''/g, "")
            .replace("(", "")
            .replace(")", "")
            .toLowerCase();
          temp = stemmer(temp);//stemming of each token
          //if the token is not in stop word list then add in positionalindex list
          if (stopwords.includes(temp) == false) {
            //if the token is not in position-index list then add the word
            if (positionalindex[temp] === undefined) {
              let arr = [j];
              positionalindex[temp] = {};
              positionalindex[temp][i] = arr;
            }
            // if doc id is ready in the position-index then add index in the list
            else if (positionalindex[temp][i] !== undefined) {
              let arr = positionalindex[temp][i];

              arr.push(j);

              positionalindex[temp][i] = arr;
            }

            //if doc id is not in the position-index then add the doc id and corresponding position of word in list
            else if (!(i.toString() in positionalindex[temp]) == true) {
              let arr = [j];
              positionalindex[temp][i] = arr;
            }
          }
        }
      }
      //saving of index in txt file for future use
      fs.writeFileSync(
        "./Files/positional.txt",
        JSON.stringify(positionalindex)
      );
    }
  })
);

// Change the port if you want
let Port = 3001;
app.listen(Port, () => {
  console.log(`Server is running on port ${Port} `);
});