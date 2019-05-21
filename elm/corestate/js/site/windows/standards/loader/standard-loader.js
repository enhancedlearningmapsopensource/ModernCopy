//console.log("...VIEW loading");
define(["text!./tables/ela.html", "text!./tables/math.html"], 
function(ElaTable, MathTable) {
	var Loader = {};
	Loader.consts = {};
	Loader.consts.TABLE_PATH = gRoot + "corestate/js/site/windows/standards/loader/tables/";
	Loader.filesLoading = [];
	
	/**
	 * Load standards
	 * @return {Promise}
	 */
	Loader.load = function(standardTable){
            //standardTable.print("test string");

            var subjects = [];
            subjects.push("math");
            subjects.push("ela");

            return Loader.loadSubjects(standardTable, subjects);
	};	
	
	/**
	 * Load subjects into standards
	 * @return {Promise}
	 */
	Loader.loadSubjects = function(standardTable, subjects, callback){
            return new Promise(function(resolve, reject){
                //subjects.forEach(function(sub){
                for(var sdex = 0; sdex < subjects.length; sdex++){
                    var sub = subjects[sdex];
                    Loader.filesLoading.push(sub);

                    var filePath = Loader.consts.TABLE_PATH + sub + ".html";
                    switch(sub){
                        case "math":
                            Loader.handleData(standardTable, MathTable);
                            break;
                        case "ela":
                            Loader.handleData(standardTable, ElaTable);
                            break;
                    }
                    if(Loader.filesLoading.length === 0){
                        resolve();
                    }
                    
                    /*$.get(filePath, function(data){
                        Loader.handleData(standardTable, data);
                        if(Loader.filesLoading.length === 0){
                            resolve();
                        }
                    });*/
                }
            });
	};
	
	Loader.expandCells = function(json){
		var numTopics = json.topics.length;
		for(var i = 0; i < numTopics; i++){
			var topic = json.topics.shift();
			if(topic.cells.length > 0){
				var arr = [];
				if(typeof topic.cells[0] === "string"){
					topic.cells.forEach(function(c){
						arr.push(c);
					});
					topic.cells = [arr];
				}
			}
			
			var numCells = topic.cells.length;
			for(var c = 0; c < numCells; c++){
				var cell = topic.cells.shift();
				
				
				/**
				 * Replace range 
				 */
				var numParts = cell.length;
				var maxRange = 1;
				for(var p = 0; p < numParts; p++){
					var part = cell.shift();
					var split = part.split("-");
					if(split.length > 1){
						/**
						 * Check to see that both range ends are numeric 
						 */
						var isValid = true;
						for(var splitCheck = 0; splitCheck < split.length; splitCheck++){
							if(!$.isNumeric(split[splitCheck])){
								cell.push([part]);
								isValid = false;
								break;
							}
						}
						if(!isValid){
							continue;
						}
						
						/**
						 * Handle valid range
						 */
						var rangeArr = [];
						for(var s = parseInt(split[0]); s <= parseInt(split[1]); s++){
							rangeArr.push(s);
						}
						cell.push(rangeArr);
						if(rangeArr.length > maxRange){
							maxRange = rangeArr.length;
						}
					}else{
						cell.push([part]);
					}
				}
				
				/**
				 * Balance arrays 
				 */
				for(var p = 0; p < numParts; p++){
					var part = cell.shift();
					if(part.length == 1){
						for(var rangeIndex = 0; rangeIndex < (maxRange - 1); rangeIndex++){
							part.push(part[0]);
						}
					}
					cell.push(part);
				}
				
				/**
				 * Merge arrays 
				 */
				for(var rangeIndex = 0; rangeIndex < maxRange; rangeIndex++){
					var newCell = [];
					for(var p = 0; p < numParts; p++){
						newCell.push(cell[p].shift());
					}
					topic.cells.push(newCell.join("."));
				}
			}
			
			json.topics.push(topic);
			/*if(topic.hasOwnProperty("break")){
				json.topics.push({name: "", broken: true, length: topic.break, cells: [[{name:"", broken: true, length: topic.break}]]});
			}*/
		}
	};
        
        Loader.handleData = function(standardTable, data){
            
            json = Loader.getData(data);

            /** 
             * Prepare grades 
             */
            var numGrades = json.grades.length;
            for(var i = 0; i < numGrades; i++){
                    var grade = json.grades.shift();
                    var gradeOb = {id: i};
                    if(typeof grade === "object"){
                            gradeOb.short = grade.short;
                            gradeOb.name = grade.grade;
                    }else{
                            gradeOb.name = grade;
                    }
                    json.grades.push(gradeOb);
            }

            /**
             * Expand cells 
             */
            Loader.expandCells(json);


            /** 
             * Prepare rows 
             */
            var cellsPerRow = numGrades;
            var cellsRemaining = 0;
            var topicIndex = 0;
            var cellIndex = 0;
            var row = null;
            var rowList = [];
            var topicID = 0;
            var cellID = 0;

            json.cells = [];

            json.topics.forEach(function(topic){
                    if(cellsRemaining == 0){
                            if(row != null){
                                    rowList.push(row);
                                    row = null;
                            }
                            row = {topics: [], cells: []};
                            cellsRemaining = cellsPerRow;
                    }

                    /// Add Topic
                    topic.id = topicID;
                    topic.length = topic.cells.length;
                    row.topics.push(topic);
                    topicID++;

                    //topic.cells.forEach(function(cell){
                    for(var cellLoopIndex = 0; cellLoopIndex < topic.cells.length; cellLoopIndex++){
                            cell = topic.cells[cellLoopIndex];

                            /// Add Cell
                            var cellOb = {name: cell, id: cellID, topic: topic, grade: json.grades[cellsPerRow-cellsRemaining]};
                            row.cells.push(cellOb);
                            topic.cells[cellLoopIndex] = cellOb;
                            json.cells.push(cellOb);

                            cellID++;
                            cellsRemaining--;
                    };

                    if(topic.hasOwnProperty("break")){
                            var breakLength = parseInt(topic.break);
                            row.topics.push({name:"", length: breakLength, broken: true});
                            for(var bIndex = 0; bIndex < breakLength; bIndex++){
                                    row.cells.push({name:"", length: 1, broken: true});
                            }
                            cellsRemaining -= breakLength;
                    }

            });

            if(row != null){
                rowList.push(row);
                row = null;
            }
            json.rows = rowList;
            json.cols = cellsPerRow;
            standardTable.load(json);

            // Check and respond
            var jsonSub = json.subject;
            for(var ldex = 0; ldex < Loader.filesLoading.length; ldex++){
                if(Loader.filesLoading[ldex] == jsonSub){
                    Loader.filesLoading.splice(ldex,1);
                    break;
                }
            }
        };
	
	Loader.removeWhitespace = function(data){
		/*data = data.replace(" ","");*/
		data = data.replace("\n","");
		data = data.replace("\r","");
		data = data.replace(/[\n\r]+/g, '');
		/*data = data.replace(/\s+/g, '');*/
		data = data.replace(/,\s+/g, ',');
		data = data.replace(/]\s+/g, ']');
		data = data.replace(/\"\s+/g, '"');
		data = data.replace(/\n+/g, '');
		data = data.replace(/\r+/g, '');
		return data;
	};
	
	Loader.removeInvalidCommas = function(data){
		data = data.replace(/,\]/g, ']');
		data = data.replace(/,\}/g, '}');
		return data;
	};
	
	Loader.getData = function(data){
		data = Loader.removeWhitespace(data);
		data = Loader.removeInvalidCommas(data);
		
		var arr = [];
		var re = /\[\[([^\]]*?)\]\]/g;
		while(match = re.exec(data)) {
		  	arr.push(match[1]);
		}
		arr.forEach(function(sub){
			data = data.replace("[["+sub+"]]", "["+sub+"]");
		});
		
		data = Loader.removeInvalidCommas(data);
		data = Loader.removeInvalidCommas(data);
		
		return JSON.parse(data);
	};
	
	return Loader;
});