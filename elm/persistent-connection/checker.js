define(["jquery"], function($){
    class Checker{
        check(){
            $.post(gRoot + "/persistent-connection/check-connection.php", {}, function(ret){
                if(ret.trim() === "false"){
                    window.location = gRoot + "login/logout.php";
                }else if(ret.trim() !== "true"){
                    throw Error("Unknown response: " + ret);
                }
            });
        }

        start(){
            var thisClass = this;
            this.update();
        }

        update(){
            var thisClass = this;
            thisClass.check();
            setTimeout(function(){
                thisClass.update();
            }, 2000);
        }
    }


    if(typeof window.persistentcheck === "undefined"){
        window.persistentcheck = new Checker();
        window.persistentcheck.start();
    }
});