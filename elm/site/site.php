

<div class="site-body {{#locked}}locked{{/locked}} {{#roster}}roster{{/roster}}">
    <?php //=================================================   ?>
    <?php //== LOCK SCREEN TO PREVENT USER INPUT                ?>
    <?php //=================================================   ?>
    <div id="lockscreen">
        <div id="loader">
        </div>
        <div id="status">{{{message}}}</div>
    </div>


    <?php //=================================================   ?>
    <?php //== FIXED ELEMENTS SUCH AS THE WINDOWS AND NAVBAR    ?>
    <?php //=================================================   ?>
    <div id="fixed" class="hidden-print">
        <div class="main-window-area"></div>
        <div class="resource-manager-area"></div>
        <div class="navbar-area"></div>
    </div>

    <?php //=================================================   ?>
    <?php //== OVERLAY WINDOWS                                  ?>
    <?php //=================================================   ?>
    <div id="overlay">
    </div>
</div>