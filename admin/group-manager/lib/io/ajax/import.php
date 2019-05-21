<?php

require_once("../../../../../../ajax.php");
require_once($gRoot . "../modernalpha/hub/ajax/utility/sanitize.php");

$data = $_POST["data"];

//$data2 = '{"PREFERENCE":{"SITE_BETA":{"NAME":"SITE_BETA","DESCRIPTION":"Allows access to modernbeta.","PROGRAM_CODE":"SITE_BETA","GROUPNAME":null,"GROUPS":[null,"admin","superadmin"]},"SITE_MAIN":{"NAME":"SITE_MAIN","DESCRIPTION":"Allows access to moderncopy. Makes it even more difficult to hack.","PROGRAM_CODE":"SITE_MAIN","GROUPNAME":null,"GROUPS":[null,"pilot","admin","superadmin"]},"RESOURCE":{"NAME":"RESOURCE","DESCRIPTION":"","PROGRAM_CODE":"RESOURCE","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"DISCUSSIONS":{"NAME":"DISCUSSIONS","DESCRIPTION":"","PROGRAM_CODE":"DISCUSSIONS","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"ROSTER":{"NAME":"ROSTER","DESCRIPTION":"","PROGRAM_CODE":"ROSTER","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]}},"PERMISSION":{"STATE":{"NAME":"State","TYPE":"mc","CHOICES":"National (CCSS), Alaska, Iowa, Kansas, Missouri, Wisconsin","DEFAULTVALUE":"a","PROGRAM_CODE":"STATE","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"SUBJECT":{"NAME":"Default Subject","TYPE":"mc","CHOICES":"ELA,Math","DEFAULTVALUE":"b","PROGRAM_CODE":"SUBJECT","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"NODEID_ON":{"NAME":"Show Node IDs","TYPE":"check","CHOICES":"","DEFAULTVALUE":"f","PROGRAM_CODE":"NODEID_ON","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"INDIR_ON":{"NAME":"Show Indirect (Dashed) Connections","TYPE":"check","CHOICES":"","DEFAULTVALUE":"t","PROGRAM_CODE":"INDIR_ON","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"HOUR_UP":{"NAME":"Hourglass Zoom: # Nodes Above","TYPE":"mc","CHOICES":"0,1,2,3,4,5","DEFAULTVALUE":"c","PROGRAM_CODE":"HOUR_UP","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"HOUR_DN":{"NAME":"Hourglass Zoom: # Nodes Below","TYPE":"mc","CHOICES":"0,1,2,3,4,5","DEFAULTVALUE":"c","PROGRAM_CODE":"HOUR_DN","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"OENTER_ON":{"NAME":"Disable Omnisearch Enter Key","TYPE":"check","CHOICES":"","DEFAULTVALUE":"t","PROGRAM_CODE":"OENTER_ON","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"FONT_G":{"NAME":"Graph Font","TYPE":"mc","CHOICES":"Trebuchet,Courier New","DEFAULTVALUE":"a","PROGRAM_CODE":"FONT_G","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"SSET":{"NAME":"Standard Set","TYPE":"mc","CHOICES":"CCSS","DEFAULTVALUE":"a","PROGRAM_CODE":"SSET","GROUPNAME":"pilot","GROUPS":["pilot","admin","superadmin"]},"SHWHLP_UR":{"NAME":"Show User Resources Help","TYPE":"check","CHOICES":"t,f","DEFAULTVALUE":"t","PROGRAM_CODE":"SHWHLP_UR","GROUPNAME":"admin","GROUPS":["admin","superadmin"]},"SHWHLP_F":{"NAME":"Show Find Resource Help","TYPE":"check","CHOICES":"t,f","DEFAULTVALUE":"t","PROGRAM_CODE":"SHWHLP_F","GROUPNAME":"admin","GROUPS":["admin","superadmin"]}},"USER":{"elmmaster@ku.edu":{"EMAIL":"elmmaster@ku.edu","GROUPNAME":"admin","GROUPS":["admin","superadmin"]},"elmpilot@ku.edu":{"EMAIL":"elmpilot@ku.edu","GROUPNAME":"admin","GROUPS":["admin","pilot"]},"nkingsto@ku.edu":{"EMAIL":"nkingsto@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"leko@ku.edu":{"EMAIL":"leko@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"cdmould@sunprairieschools.org":{"EMAIL":"cdmould@sunprairieschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"enhancedlm@ku.edu":{"EMAIL":"enhancedlm@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"lewisl@live.siouxcityschools.com":{"EMAIL":"lewisl@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"jayhawk1@ku.edu":{"EMAIL":"jayhawk1@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"jayhawk2@ku.edu":{"EMAIL":"jayhawk2@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"cpenning@northwestschools.net":{"EMAIL":"cpenning@northwestschools.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"jkaplan@uga.edu":{"EMAIL":"jkaplan@uga.edu","GROUPNAME":"admin","GROUPS":["admin"]},"jtemplin@ku.edu":{"EMAIL":"jtemplin@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"dmaxwell@walton.k12.ga.us":{"EMAIL":"dmaxwell@walton.k12.ga.us","GROUPNAME":"admin","GROUPS":["admin"]},"hhulsizer@benedictine.edu":{"EMAIL":"hhulsizer@benedictine.edu","GROUPNAME":"admin","GROUPS":["admin"]},"semyers@ksde.org":{"EMAIL":"semyers@ksde.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"clickvar@ku.edu":{"EMAIL":"clickvar@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"cvbrand@sunprairieschools.org":{"EMAIL":"cvbrand@sunprairieschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"geoffrey.wyatt@juneauschools.org":{"EMAIL":"geoffrey.wyatt@juneauschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"ecremer79@gmail.com":{"EMAIL":"ecremer79@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"njessop@ku.edu":{"EMAIL":"njessop@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"heimgas@live.siouxcityschools.com":{"EMAIL":"heimgas@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"markca@ku.edu":{"EMAIL":"markca@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"tbell@nwarctic.org":{"EMAIL":"tbell@nwarctic.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"landersen@ku.edu":{"EMAIL":"landersen@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"nlindner@ku.edu":{"EMAIL":"nlindner@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"lziegler@iastate.edu":{"EMAIL":"lziegler@iastate.edu","GROUPNAME":"admin","GROUPS":["admin"]},"missy.henneman@wrps.net":{"EMAIL":"missy.henneman@wrps.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"dale_cope@ku.edu":{"EMAIL":"dale_cope@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"sarahmckay@ku.edu":{"EMAIL":"sarahmckay@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"hollyk1019@gmail.com":{"EMAIL":"hollyk1019@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"ssstamm@msn.com":{"EMAIL":"ssstamm@msn.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"hollywetmore@ku.edu":{"EMAIL":"hollywetmore@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"chavecar@usd437.net":{"EMAIL":"chavecar@usd437.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"mlutz@uga.edu":{"EMAIL":"mlutz@uga.edu","GROUPNAME":"admin","GROUPS":["admin"]},"mpowers@monettschools.org":{"EMAIL":"mpowers@monettschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"jgsfla@ku.edu":{"EMAIL":"jgsfla@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"rsr@ku.edu":{"EMAIL":"rsr@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"gtiemann@ku.edu":{"EMAIL":"gtiemann@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"spoettke@usd497.org":{"EMAIL":"spoettke@usd497.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"cgayler@ku.edu":{"EMAIL":"cgayler@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"walterwilliams@ku.edu":{"EMAIL":"walterwilliams@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"cmgayler@gmail.com":{"EMAIL":"cmgayler@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"lculprr@olatheschools.org":{"EMAIL":"lculprr@olatheschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"csantiago@allenvillageschool.com":{"EMAIL":"csantiago@allenvillageschool.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"kemasel@sunprairieschools.org":{"EMAIL":"kemasel@sunprairieschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"bieginld@hudson.k12.wi.us":{"EMAIL":"bieginld@hudson.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"ksubarbara@live.com":{"EMAIL":"ksubarbara@live.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"tararunaas@gmail.com":{"EMAIL":"tararunaas@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"wrjenson@smsd.org":{"EMAIL":"wrjenson@smsd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"norman_ayagalria@lksd.org":{"EMAIL":"norman_ayagalria@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"kdileonardo@usd345.com":{"EMAIL":"kdileonardo@usd345.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"broaddus@ku.edu":{"EMAIL":"broaddus@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"ncox@usd232.org":{"EMAIL":"ncox@usd232.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"abarkley@ku.edu":{"EMAIL":"abarkley@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"lwiegele@ku.edu":{"EMAIL":"lwiegele@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"jayhawk@ku.edu":{"EMAIL":"jayhawk@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"melmeyer@ku.edu":{"EMAIL":"melmeyer@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"janet.coco@usd409.net":{"EMAIL":"janet.coco@usd409.net","GROUPNAME":"pilot","GROUPS":["pilot"]},"mdanderson@usd260.com":{"EMAIL":"mdanderson@usd260.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"jmccoy@usd207.org":{"EMAIL":"jmccoy@usd207.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"cjanouse@usd497.org":{"EMAIL":"cjanouse@usd497.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"newaccount@ku.edu":{"EMAIL":"newaccount@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"erb_bobbijo@asdk12.org":{"EMAIL":"erb_bobbijo@asdk12.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"mlinton@kpbsd.k12.ak.us":{"EMAIL":"mlinton@kpbsd.k12.ak.us","GROUPNAME":"pilot","GROUPS":["pilot"]},"karen.melin@k12northstar.org":{"EMAIL":"karen.melin@k12northstar.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"kherring@kpbsd.k12.ak.us":{"EMAIL":"kherring@kpbsd.k12.ak.us","GROUPNAME":"pilot","GROUPS":["pilot"]},"h044h033@ku.edu":{"EMAIL":"h044h033@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"bhenderson@kuspuk.org":{"EMAIL":"bhenderson@kuspuk.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"dthompson1@usd259.net":{"EMAIL":"dthompson1@usd259.net","GROUPNAME":"pilot","GROUPS":["pilot"]},"hberry@kuspuk.org":{"EMAIL":"hberry@kuspuk.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"barbara.adams@alaska.edu":{"EMAIL":"barbara.adams@alaska.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"samantha.wuttig@k12northstar.org":{"EMAIL":"samantha.wuttig@k12northstar.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"lindsey.wiegele@gmail.com":{"EMAIL":"lindsey.wiegele@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"cmhogue@ku.edu":{"EMAIL":"cmhogue@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"kaylee.newby@ku.edu":{"EMAIL":"kaylee.newby@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"sashaferyok@ku.edu":{"EMAIL":"sashaferyok@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"nlindner@usd207.org":{"EMAIL":"nlindner@usd207.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"jrmiller@ku.edu":{"EMAIL":"jrmiller@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"aphillips.guzman@gmail.com":{"EMAIL":"aphillips.guzman@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"daniellefrakes@gmail.com":{"EMAIL":"daniellefrakes@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"DISABLEDsashaferyok@ku.edu":{"EMAIL":"DISABLEDsashaferyok@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"DISABLEDmeghan.kaheny@ku.edu":{"EMAIL":"DISABLEDmeghan.kaheny@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"meghan.kaheny@ku.edu":{"EMAIL":"meghan.kaheny@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"DISABLEDsmarten@ku.edu":{"EMAIL":"DISABLEDsmarten@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"kcleman@ku.edu":{"EMAIL":"kcleman@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"DISABLEDkcleman@ku.edu":{"EMAIL":"DISABLEDkcleman@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"smarten@ku.edu":{"EMAIL":"smarten@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"spare_larissa@ku.edu":{"EMAIL":"spare_larissa@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"elmteacher@ku.edu":{"EMAIL":"elmteacher@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"elmpartner@ku.edu":{"EMAIL":"elmpartner@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"marci.glaus@dpi.wi.gov":{"EMAIL":"marci.glaus@dpi.wi.gov","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"swin0030@ku.edu":{"EMAIL":"swin0030@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"pamelakaybarry@gmail.com":{"EMAIL":"pamelakaybarry@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"bfultz@ksde.org":{"EMAIL":"bfultz@ksde.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"deborah.riddle@alaska.gov":{"EMAIL":"deborah.riddle@alaska.gov","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mheritag@ucla.edu":{"EMAIL":"mheritag@ucla.edu","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"barbarab@ku.edu":{"EMAIL":"barbarab@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"sschafer@ksde.org":{"EMAIL":"sschafer@ksde.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"emily.thatcher@iowa.gov":{"EMAIL":"emily.thatcher@iowa.gov","GROUPNAME":"pilot","GROUPS":["pilot"]},"jlakin@ksde.org":{"EMAIL":"jlakin@ksde.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"qharms@nc.k12.mo.us":{"EMAIL":"qharms@nc.k12.mo.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"moranm@live.siouxcityschools.com":{"EMAIL":"moranm@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"mccoskey@cr6.net":{"EMAIL":"mccoskey@cr6.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"abostic@kpbsd.k12.ak.us":{"EMAIL":"abostic@kpbsd.k12.ak.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"melissa.cormier@zizzers.org":{"EMAIL":"melissa.cormier@zizzers.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"blattnerjennif@aasd.k12.wi.us":{"EMAIL":"blattnerjennif@aasd.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"tina.gibson11@gmail.com":{"EMAIL":"tina.gibson11@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"hickmaj@live.siouxcityschools.com":{"EMAIL":"hickmaj@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"kellykolasinski@hasd.org":{"EMAIL":"kellykolasinski@hasd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"DISABLEDjunowyatt@gmail.com":{"EMAIL":"DISABLEDjunowyatt@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"adam.doten-ferguson@juneauschools.org":{"EMAIL":"adam.doten-ferguson@juneauschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"tsmithrr@olatheschools.org":{"EMAIL":"tsmithrr@olatheschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"aburns@depere.k12.wi.us":{"EMAIL":"aburns@depere.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"rwarkins@usd261.com":{"EMAIL":"rwarkins@usd261.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"cweisbrod@wwusd.org":{"EMAIL":"cweisbrod@wwusd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"dmartin@usd232.org":{"EMAIL":"dmartin@usd232.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"gilmorc@live.siouxcityschools.com":{"EMAIL":"gilmorc@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"aboyles@cowgillr6.org":{"EMAIL":"aboyles@cowgillr6.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"aswiley@sunprairieschools.org":{"EMAIL":"aswiley@sunprairieschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"rking@clarkcounty.k12.mo.us":{"EMAIL":"rking@clarkcounty.k12.mo.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"schoenc1@live.siouxcityschools.com":{"EMAIL":"schoenc1@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"dtrue72@gmail.com":{"EMAIL":"dtrue72@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"woodards@usd413.org":{"EMAIL":"woodards@usd413.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"eoestrei@wausauschools.org":{"EMAIL":"eoestrei@wausauschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"olsonw@live.siouxcityschools.com":{"EMAIL":"olsonw@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"mccartk@live.siouxcityschools.com":{"EMAIL":"mccartk@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"duriod@live.siouxcityschools.com":{"EMAIL":"duriod@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"nealk@live.siouxcityschools.com":{"EMAIL":"nealk@live.siouxcityschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"slattery.chelsea@usd443.org":{"EMAIL":"slattery.chelsea@usd443.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"alli_hawksley@isdschools.org":{"EMAIL":"alli_hawksley@isdschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"donna.true@usd253.net":{"EMAIL":"donna.true@usd253.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"temynatt@gmail.com":{"EMAIL":"temynatt@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"laurahelweg@ku.edu":{"EMAIL":"laurahelweg@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"selenium_mapmanageradmin@ku.edu":{"EMAIL":"selenium_mapmanageradmin@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"selenium_mapmanagerpilot@ku.edu":{"EMAIL":"selenium_mapmanagerpilot@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"mperie@ku.edu":{"EMAIL":"mperie@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"elmadmin@ku.edu":{"EMAIL":"elmadmin@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"athomas@usd348.com":{"EMAIL":"athomas@usd348.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"140":{"EMAIL":"140","GROUPNAME":"admin","GROUPS":["admin"]},"nmfarmer@ku.edu":{"EMAIL":"nmfarmer@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"nlister@ksde.org":{"EMAIL":"nlister@ksde.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"elmemailtest@gmail.com":{"EMAIL":"elmemailtest@gmail.com","GROUPNAME":"admin","GROUPS":["admin"]},"jmallak@wittbirn.k12.wi.us":{"EMAIL":"jmallak@wittbirn.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"kaylacooley@hasd.org":{"EMAIL":"kaylacooley@hasd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"kristen.burton@dpi.wi.gov":{"EMAIL":"kristen.burton@dpi.wi.gov","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"srand@usd288.org":{"EMAIL":"srand@usd288.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"kathy.wehmeyer@ku.edu":{"EMAIL":"kathy.wehmeyer@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"kgood@mcrel.org":{"EMAIL":"kgood@mcrel.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"mjorosco@ku.edu":{"EMAIL":"mjorosco@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"mhock@ku.edu":{"EMAIL":"mhock@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"lacoukat@usd437.net":{"EMAIL":"lacoukat@usd437.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mebbesmeyer@paris.k12.mo.us":{"EMAIL":"mebbesmeyer@paris.k12.mo.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"pwitmer@greenhills.net":{"EMAIL":"pwitmer@greenhills.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"kimberly_hughes@lksd.org":{"EMAIL":"kimberly_hughes@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"maderk@usd230.org":{"EMAIL":"maderk@usd230.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"sharon_nicolaus@lksd.org":{"EMAIL":"sharon_nicolaus@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mary.williams@usd340.org":{"EMAIL":"mary.williams@usd340.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"artzeche@usd437.net":{"EMAIL":"artzeche@usd437.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"plachter@usd437.net":{"EMAIL":"plachter@usd437.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"dixonrob@usd437.net":{"EMAIL":"dixonrob@usd437.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"karsen.greenwood@hillsboroschools.org":{"EMAIL":"karsen.greenwood@hillsboroschools.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"kwells@clarkcounty.k12.mo.us":{"EMAIL":"kwells@clarkcounty.k12.mo.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"natashakelly@usd475.org":{"EMAIL":"natashakelly@usd475.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"jlancaster@usd348.com":{"EMAIL":"jlancaster@usd348.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mareta.weed@gmail.com":{"EMAIL":"mareta.weed@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"thebuttermilkqueen@gmail.com":{"EMAIL":"thebuttermilkqueen@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"jscogin@crsd.us":{"EMAIL":"jscogin@crsd.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"kcox@monettschools.org":{"EMAIL":"kcox@monettschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"randi_markley@lksd.org":{"EMAIL":"randi_markley@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"megan.thompson@usd262.net":{"EMAIL":"megan.thompson@usd262.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"michelle.adgate@yukonflats.net":{"EMAIL":"michelle.adgate@yukonflats.net","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"bdinkel@gckschools.com":{"EMAIL":"bdinkel@gckschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"azemlo@hartlake.org":{"EMAIL":"azemlo@hartlake.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"pgrieser@wausauschools.org":{"EMAIL":"pgrieser@wausauschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"cmsmith@usd497.org":{"EMAIL":"cmsmith@usd497.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"hamakowsky@gmail.com":{"EMAIL":"hamakowsky@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"hrobb@nomeschools.com":{"EMAIL":"hrobb@nomeschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"angelaschlagel@usd475.org":{"EMAIL":"angelaschlagel@usd475.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"abledsoe@monettschools.org":{"EMAIL":"abledsoe@monettschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"fairchildb@usd413.org":{"EMAIL":"fairchildb@usd413.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"deborah.zaeske@muskegonorway.org":{"EMAIL":"deborah.zaeske@muskegonorway.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"ssorenson@piperschools.com":{"EMAIL":"ssorenson@piperschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"dkorkki@eldoradoschools.org":{"EMAIL":"dkorkki@eldoradoschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"drades@wittbirn.k12.wi.us":{"EMAIL":"drades@wittbirn.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"krisanne_morgan@lksd.org":{"EMAIL":"krisanne_morgan@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"lovedeb29@gmail.com":{"EMAIL":"lovedeb29@gmail.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"jacob_groll@lksd.org":{"EMAIL":"jacob_groll@lksd.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"lenzamy@gcsd.k12.wi.us":{"EMAIL":"lenzamy@gcsd.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"kgoodwin@crsd.us":{"EMAIL":"kgoodwin@crsd.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"ckooistra@etudegroup.org":{"EMAIL":"ckooistra@etudegroup.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mderfus@wausauschools.org":{"EMAIL":"mderfus@wausauschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"bibarth@sunprairieschools.org":{"EMAIL":"bibarth@sunprairieschools.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"akoontz@tps501.org":{"EMAIL":"akoontz@tps501.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"katiejobritton@yahoo.com":{"EMAIL":"katiejobritton@yahoo.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"cpritchett@usd261.com":{"EMAIL":"cpritchett@usd261.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"melindabyers@usd509.org":{"EMAIL":"melindabyers@usd509.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"rdaniels@tps501.org":{"EMAIL":"rdaniels@tps501.org","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"shattuckjulie@aasd.k12.wi.us":{"EMAIL":"shattuckjulie@aasd.k12.wi.us","GROUPNAME":"pilot","GROUPS":["pilot","cohort2"]},"mary.mooney@dpi.wi.gov":{"EMAIL":"mary.mooney@dpi.wi.gov","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"":{"EMAIL":"","GROUPNAME":"pilot","GROUPS":["pilot"]},"jes.sch@ku.edu":{"EMAIL":"jes.sch@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"gkliu@ku.edu":{"EMAIL":"gkliu@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"maryfulbright@smsd.org":{"EMAIL":"maryfulbright@smsd.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"pilotdebug@ku.edu":{"EMAIL":"pilotdebug@ku.edu","GROUPNAME":null,"GROUPS":[null]},"bobkowski@ku.edu":{"EMAIL":"bobkowski@ku.edu","GROUPNAME":"cohort1","GROUPS":["cohort1"]},"tmase@lpsd.com":{"EMAIL":"tmase@lpsd.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"d306v594@ku.edu":{"EMAIL":"d306v594@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"abroaddus@benedictine.edu":{"EMAIL":"abroaddus@benedictine.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"k946j303@ku.edu":{"EMAIL":"k946j303@ku.edu","GROUPNAME":"admin","GROUPS":["admin"]},"ddenney@piperschools.com":{"EMAIL":"ddenney@piperschools.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"sgerber@piperschools.com":{"EMAIL":"sgerber@piperschools.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"mbrandt@piperschools.com":{"EMAIL":"mbrandt@piperschools.com","GROUPNAME":"pilot","GROUPS":["pilot","cohort1"]},"jakethompson@ku.edu":{"EMAIL":"jakethompson@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"aliciastoltenberg@ku.edu":{"EMAIL":"aliciastoltenberg@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"chip.sharp@dese.mo.gov":{"EMAIL":"chip.sharp@dese.mo.gov","GROUPNAME":"pilot","GROUPS":["pilot"]},"creese@piperschools.com":{"EMAIL":"creese@piperschools.com","GROUPNAME":"pilot","GROUPS":["pilot"]},"nhollomon@ottervillervi.k12.mo.us":{"EMAIL":"nhollomon@ottervillervi.k12.mo.us","GROUPNAME":"pilot","GROUPS":["pilot"]},"mary.newby@republicschools.org":{"EMAIL":"mary.newby@republicschools.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"bhain@cpeducation.org":{"EMAIL":"bhain@cpeducation.org","GROUPNAME":"pilot","GROUPS":["pilot"]},"jacintafillinger@ku.edu":{"EMAIL":"jacintafillinger@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"hillmer@ku.edu":{"EMAIL":"hillmer@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"dvermaakwork@gmail.com":{"EMAIL":"dvermaakwork@gmail.com","GROUPNAME":null,"GROUPS":[null]},"dainvermaak@hotmail.com":{"EMAIL":"dainvermaak@hotmail.com","GROUPNAME":null,"GROUPS":[null]},"c591n060@ku.edu":{"EMAIL":"c591n060@ku.edu","GROUPNAME":"pilot","GROUPS":["pilot"]},"hollyk1019@hotmail.com":{"EMAIL":"hollyk1019@hotmail.com","GROUPNAME":"pilot","GROUPS":["pilot"]}}}';

//for($i = 0; $i < 10;/*strlen($data);*/ $i++){
 /*   if(strcmp($data[$i], $data2[$i]) != 0){
        echo "NE: " . $data[$i] . " vs " . $data2[$i] . "\n";
    }
}*/

//echo ($data);

$json = json_decode($data, true);

$group = array();

function getUserID($email){
    global $database;
    $query = "SELECT * FROM ELM_USER WHERE EMAIL LIKE '$email'";
    $result = $database->PrototypeQuery($query);
    if(isset($result) && isset($result["result"])){
        $row = $database->fetch($result);
        return $row["USERID"];
    }else{
        $query = "SELECT * FROM ELM_USER WHERE EMAIL LIKE '".Sanitize($email)."'";
        $result = $database->PrototypeQuery($query);
        if(isset($result) && isset($result["result"])){
            $row = $database->fetch($result);
            return $row["USERID"];
        }
        return -1;
    }
}

/**
 * Imports the group with the given name if none exists. Returns the id of the group.
 * @param {string} $groupName - the name of the group
 * @return {number} - the group id
 */
function importGroup($groupName){
    global $database, $group;
    echo "Importing group: $groupName\n";
    
    // Check the cache
    if(isset($group[$groupName])){
        return $group[$groupName];
    }else{
        $query = "SELECT * FROM ELM_GROUP WHERE NAME LIKE '$groupName'";
        $result = $database->PrototypeQuery($query);
        if(isset($result["result"])){
            $row = $database->fetch($result);
            $group[$groupName] = $row["GROUPID"];
            return $group[$groupName];
        }else{
            return insertGroup($groupName);
        }
    }
}

function importPermission($json){
    global $database;
    echo "Importing permission with code: " . $json["PROGRAM_CODE"] . "\n";
    insertPermission($json);
}

function importPermissions($json){
    global $database;
    echo "Importing permissions\n";
    $database->CreatePermissionTable();
    
    foreach($json as $pref){
        importPermission($pref);
    }
}

function importPreference($json){
    global $database;
    echo "Importing preference with code: " . $json["PROGRAM_CODE"] . "\n";
    insertPreference($json);
}



function importPreferences($json){
    global $database;
    echo "Importing preferences\n";
    $database->CreatePreferenceTable();
    
    foreach($json as $pref){
        importPreference($pref);
    }
}

function importUser($json){
    global $database;
    echo "Importing user. Email: [". $json["EMAIL"] . "]\n";
    
    $userID = getUserID($json["EMAIL"]);
    if($userID == -1){
        echo ">> Error! User with email:[". $json["EMAIL"] . "] does not exist.\n";
        return;
    }
    
    
    foreach($json["GROUPS"] as $groupName){
        $groupID = importGroup($groupName);
        $query = "SELECT * FROM ELM_USERGROUP WHERE USERID=$userID AND GROUPID=$groupID";
        $result = $database->PrototypeQuery($query);
        if(isset($result) && isset($result["result"])){
            echo ">> User already in group.\n";
        }else{
            $database->AddUserToGroup($userID, $groupID);
        }
    }
    
    
    
}

function importUsers($json){
    global $database;
    echo "Importing users\n";
    //$database->CreatePreferenceTable();
    
    foreach($json as $pref){
        importUser($pref);
    }
}

function insertGroup($groupName){
    global $database;
    $date = date("Y-m-d H:i:s");
    return $database->PrototypeInsert("INSERT INTO ELM_GROUP(NAME,DATECREATED,D) VALUES(?,?,?)", 
        array(
            &$groupName,
            &$date,
            &$date
        ));
}

function insertPermission($json){
    global $database;
    $date = date("Y-m-d H:i:s");
    $permissionID = $database->PrototypeInsert("INSERT INTO ELM_PERMISSION(NAME,DESCRIPTION,DATECREATED,PROGRAM_CODE) VALUES(?,?,?,?)", 
        array(
            $json["NAME"],
            $json["DESCRIPTION"],
            &$date,
            $json["PROGRAM_CODE"]
        ));
    
    // Apply to groups
    foreach($json["GROUPS"] as $groupName){
        $groupID = importGroup($groupName);
        echo "Group: ($groupName, $groupID)\n";
        $database->PrototypeInsert("INSERT INTO ELM_GROUPPERMISSION(PERMISSIONID,GROUPID,DATE,D) VALUES(?,?,?,?)", array(&$permissionID, &$groupID, &$date, &$date));
    }
}

function insertPreference($json){
    global $database;
    $date = date("Y-m-d H:i:s");
    $preferenceID = $database->PrototypeInsert("INSERT INTO ELM_PREFERENCE(NAME,FORMTYPE,CHOICES,DEFAULTVALUE,ISDISABLED,DATECREATED,PROGRAM_CODE,D) VALUES(?,?,?,?,?,?,?,?)", 
        array(
            $json["NAME"],
            $json["TYPE"],
            $json["CHOICES"],
            $json["DEFAULTVALUE"],
            0,
            &$date,
            $json["PROGRAM_CODE"],
            &$date
        ));
    
    // Apply to groups
    foreach($json["GROUPS"] as $groupName){
        $groupID = importGroup($groupName);
        echo "Group: ($groupName, $groupID)\n";
        $database->PrototypeInsert("INSERT INTO ELM_GROUPPREFERENCE(PREFERENCEID,GROUPID,DATECREATED) VALUES(?,?,?)", array(&$preferenceID, &$groupID, &$date));
    }
}

foreach($json as $k => $v){
    switch($k){
        case "PREFERENCE":
            importPreferences($v);
            break;
        case "PERMISSION":
            importPermissions($v);
            break;
        case "USER":
            importUsers($v);
            break;
    }
}

PreVarDump($json);



