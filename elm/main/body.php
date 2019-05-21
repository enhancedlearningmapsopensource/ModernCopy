<?php
/**
 * Set up content that appears within the 'body' tag of the main page.
 */
 ?>

<div class="site-area">
    <div class="site-body locked">
        <div id="lockscreen">
            <div id="loader">
            </div>
            <div id="status"></div>
        </div>
    </div>
</div>

<!-- Start the requirejs package manager -->
<script>
    const loadCascade = false; 
</script>
<script data-main='<?= ELM_PATH ?>corestate/js/require/require-config-main.js' src='<?=ELM_ROOT ?>external-lib/require/v2.3.6/require.min.js'></script>


<?php if($userID == 1){ ?>
    <!-- Load a window in the bottom right corner containing window size details for super admin -->
    <div id="window-class">
        v1.1<br />
        db: <?= DbDatabase() ?>
        <div id="normal">
            >1200px Normal (.col-lg-)
        </div>
        <div id="medium">
            >992px Medium (.col-md-)
        </div>
        <div id="small">
            >768px Small (.col-sm-)
        </div>
        <div id="mobile-portrait">
            <480px Mobile-Portrait (.col-xs-)
        </div>
        <div id="mobile-landscape">
            >480 Mobile-Landscape (.col-xs-)
        </div>
    </div>
<?php } ?>

