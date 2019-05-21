<?php $globals = array("gRoot"=>ELM_ROOT, "database"=>$database); ?>

<div id="bottom-panel">
    
    <?php WriteTemplate(ELM_ROOT . "corestate/templates/site/windows/graph/bottom-panel/bottom-panel-node-template.html", "bottom-panel-template") ?>
    <?php WriteTemplate(ELM_ROOT . "corestate/templates/site/windows/graph/bottom-panel/bottom-panel-edge-template.html", "bottom-panel-edge-template") ?>
    <div class="content-container">
        <div class="row" id="bot-header">
            <div class="col-xs-12">
                <div class="row">
                    <div class="col-xs-11" id="bot-header-col">
                        Header
                    </div>
                    <div class="col-xs-1" id="bot-close-col">
                        <span class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" id="bot-content"></div>
    </div>
</div>