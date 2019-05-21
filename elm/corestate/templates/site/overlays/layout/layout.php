<?php function overlay($title, $content, $footer){ ?>
<div class="overlay-outer" id="<?php echo trim(str_replace(" ", "", strtolower($title))) ?>-overlay">
    <div class="overlay">
        <div class="overlay-inner">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-xs-12">
                        <h3><?php echo $title ?></h3>
                    </div>
                </div>
                <div class="row" id="content-row">
                    <div class="col-xs-12">
                        <?php echo $content ?>
                    </div>
                </div>
            </div>
            <hr />
            <div class="overlay-buttons">
                <?php echo $footer ?>
            </div>
        </div>
    </div>
</div>
<?php } ?>