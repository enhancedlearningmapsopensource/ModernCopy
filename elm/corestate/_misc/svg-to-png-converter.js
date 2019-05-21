define([], function () {
    var pvt = {
        consts: {
            MAX_AREA: 15789599,
            INITIAL_FACTOR: 10
        }
    };
    
    class Converter {
        /**
         * Converts a given svg to a png that is then downloaded through the browser
         * @param {DOMObject} svgContainerEl - the contair housing the svg to convert (DOM object).
         * @param {boolean} center - center the svg by removing any transforms on the primary group (<g>) element.
         */
        SvgToPng(svgContainerEl, center) {
            center = (typeof center === 'undefined' || center === null) ? true : center;
            
            // Add canvas
            $("body").append($("<canvas>"));
            
            // Add the converter div
            var $converter = $("<div>");
            $converter.attr("id", "png-converter");
            $("body").append($converter);
            
            // Add png div
            var $png = $("<div>");
            $png.attr("id", "png-converter-png");
            $converter.append($png);
            
            // Add output div
            var $out = $("<div>");
            $out.attr("id", "png-converter-out");
            $converter.append($out);
            
            // Add copy div
            var $copy = $("<div>");
            $copy.attr("id", "png-converter-copy");
            $converter.append($copy);
            
            // Get the svg raw code
            var html = $(svgContainerEl).html();
            
            // Add to copy
            $copy.html(html);
            
            // Get the svg dimensions
            //var dims = $copy.find("svg")[0].getBBox();
            var dims = $copy.find("svg").find("g:first")[0].getBBox();
            
            // Add svg properties
            $copy.find("svg").attr("version", "1.1");
            $copy.find("svg").attr("xmlns", "http://www.w3.org/2000/svg");
            
            if(center){
                $copy.find("svg").find("g:first").attr("transform", "scale(1 1)");
            }
            html = $copy.html();
            
            var imgsrc = 'data:image/svg+xml;base64,' + window.btoa(html);
            var img = '<img src="' + imgsrc + '">';
            $out.html(img);            
            
            // Get the canvas context
            var canvas = document.querySelector("canvas");
            var context = canvas.getContext("2d");
            
            // Create a new image
            var image = new Image;
            image.src = imgsrc;
            
            image.onload = function () {
                var area = null;
                var safety = 1000;
                var factor = pvt.consts.INITIAL_FACTOR;
                var canvasDims = null;
                
                // Use the max area and decrease factor until the png size fits 
                while(area === null || area > pvt.consts.MAX_AREA){
                    if((safety--) < 0){ throw Error("safety"); }
                    canvasDims = {
                        width: factor*dims.width,
                        height: factor*dims.height
                    };
                    area = canvasDims.width * canvasDims.height;
                    if(area > pvt.consts.MAX_AREA){
                        factor--;
                    }
                }
                
                // Render to canvas
                context.canvas.width = canvasDims.width;
                context.canvas.height = canvasDims.height;                
                context.fillStyle = "#FFF";
                context.fillRect(0, 0, canvasDims.width, canvasDims.height);
                context.drawImage(image, 0, 0);
                
                var canvasdata = canvas.toDataURL("image/png");
                var pngimg = '<img src="' + canvasdata + '">';
                $png.html(pngimg);
                var a = document.createElement("a");
                a.download = "sample.png";
                a.href = canvasdata;
                a.click();
                $("canvas").remove();
                $converter.html("");
                $converter.remove();
                
                assert($("#png-converter-png").length == 0);
            };
        }
        
        /**
         * Converts a given svg to a png that is then downloaded through the browser
         * @param {DOMObject} svgContainerEl - the contair housing the svg to convert (DOM object).
         * @param {boolean} center - center the svg by removing any transforms on the primary group (<g>) element.
         */
        SvgToPrintDialog(svgContainerEl, center) {
            center = (typeof center === 'undefined' || center === null) ? true : center;
            
            // Define the print window
            var printWidth = 2 * $(window).width() * 0.9;
            var printHeight = 2 * $(window).height() * 0.9;
            var options = "toolbar=no,location=no,directories=no,menubar=no,scrollbars=yes,width=" + printWidth + ",height=" + printHeight;
                
            var printWindow = window.open('', 'print', options);
            printWindow.document.open();
            
            // Add canvas
            $("body").append($("<canvas>"));
            
            // Add the converter div
            var $converter = $("<div>");
            $converter.attr("id", "png-converter");
            $("body").append($converter);
            
            // Add png div
            var $png = $("<div>");
            $png.attr("id", "png-converter-png");
            $converter.append($png);
            
            // Add output div
            var $out = $("<div>");
            $out.attr("id", "png-converter-out");
            $converter.append($out);
            
            // Add copy div
            var $copy = $("<div>");
            $copy.attr("id", "png-converter-copy");
            $converter.append($copy);
            
            // Get the svg raw code
            var html = $(svgContainerEl).html();
            
            // Add to copy
            $copy.html(html);
            
            // Get the svg dimensions
            //var dims = $copy.find("svg")[0].getBBox();
            var dims = $copy.find("svg").find("g:first")[0].getBBox();
            
            // Add svg properties
            $copy.find("svg").attr("version", "1.1");
            $copy.find("svg").attr("xmlns", "http://www.w3.org/2000/svg");
            
            if(center){
                $copy.find("svg").find("g:first").attr("transform", "scale(1 1)");
            }
            
            // Adjust for the print window
            var imgWidth = $copy.width();
            var imgHeight = $copy.height();
            
            if(imgWidth > printWidth){
                var scale = printWidth/imgWidth;
                $copy.find("svg").find("g:first").attr("transform", "scale("+scale + " " +  scale+")");
                
                imgHeight = imgHeight*scale;
            }
            
            if(imgHeight > printHeight){
                var scale = printHeight/imgHeight;
                $copy.find("svg").find("g:first").attr("transform", "scale("+scale + " " +  scale+")");
            }
            html = $copy.html();
            
            var imgsrc = 'data:image/svg+xml;base64,' + window.btoa(html);
            var img = '<img src="' + imgsrc + '">';
            $out.html(img);            
            
            // Get the canvas context
            var canvas = document.querySelector("canvas");
            var context = canvas.getContext("2d");
            
            // Create a new image
            var image = new Image;
            image.src = imgsrc;
            
            
            
            image.onload = function () {
                var area = null;
                var safety = 1000;
                var factor = pvt.consts.INITIAL_FACTOR;
                var canvasDims = null;
                
                // Use the max area and decrease factor until the png size fits 
                while(area === null || area > pvt.consts.MAX_AREA){
                    if((safety--) < 0){ throw Error("safety"); }
                    canvasDims = {
                        width: factor*dims.width,
                        height: factor*dims.height
                    };
                    area = canvasDims.width * canvasDims.height;
                    if(area > pvt.consts.MAX_AREA){
                        factor--;
                    }
                }
                
                // Render to canvas
                context.canvas.width = canvasDims.width;
                context.canvas.height = canvasDims.height;                
                context.fillStyle = "#FFF";
                context.fillRect(0, 0, canvasDims.width, canvasDims.height);
                context.drawImage(image, 0, 0);
                
                var canvasdata = canvas.toDataURL("image/png");
                var pngimg = '<img src="' + canvasdata + '" style="width: 100%;">';
                $png.html(pngimg);
                
                //var width = $(window).width() * 0.9;
                //var height = $(window).height() * 0.9;
                var content = '<!DOCTYPE html>' + 
                              '<html>' +
                              '<head><title></title></head>' +
                              '<body onload="window.focus(); window.print(); window.close();">' + 
                              pngimg +
                              '</body>' +
                              '</html>';
                //var options = "toolbar=no,location=no,directories=no,menubar=no,scrollbars=yes,width=" + width + ",height=" + height;
                //var printWindow = window.open('', 'print', options);
                //printWindow.document.open();
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.focus();                
                /*var a = document.createElement("a");
                a.download = "sample.png";
                a.href = canvasdata;
                a.click();*/
                
                
                
                $("canvas").remove();
                $converter.html("");
                $converter.remove();
                
                assert($("#png-converter-png").length == 0);
            };
        }
    }

    return new Converter();
});


