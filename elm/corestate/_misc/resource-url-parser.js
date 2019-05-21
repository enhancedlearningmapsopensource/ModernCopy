define(["hub-lib"], function(Hub){
    /**
     * Parses out the url into a set of objects describing the files/links
     * @param {string} url - the url
     * @return {object[]|null} - the objects encoded in the url or null if the url is invalid
     */
    return function(url){
        url = Hub.stripHtml(url);
        var firstTwo = url.substring(0, 2);
        if(firstTwo === "f:" || firstTwo === "l:"){
            return url.split(",").map(function(d){
                var typeSplit = d.split(":");
                if(typeSplit[0] === "f"){
                    var fileID = Number(typeSplit[1]);
                    if(Hub.get("file").has(fileID)){
                        var file = Hub.get("file").get(fileID);
                        return {
                            name: Hub.stripHtml(file.get("title")),
                            url: file.get("filename"),
                            fileid: file.id,
                            type: "file"
                        };
                    }else{
                        return {
                            name: "file deleted",
                            url: "",
                            fileid: fileID,
                            type: "missing"
                        };
                    }
                }else if(typeSplit[0] === "l"){
                    return {
                        name: "Link: " + typeSplit.slice(1).join(":"),
                        url: typeSplit.slice(1).join(":"),
                        fileid: -1,
                        type: "link"
                    };
                }else{
                    throw Error("Unknown type: " + typeSplit[0]);
                }
            });
        }else{
            return null;
        }
    };
});

