class PopoverMenu
{
    get id() { return 'MyApp.PopoverMenu'; }

    init(resolve, reject)
    {
        let _this = this;

        this.$menu = $(`
            <nav id="PopoverMenu">
                <ul>
                    <li><a data-page="MyApp.Home">Home</a></li>
                    <li><a data-page="MyApp.About">About</a></li>
                </ul>
            </nav>
        `);

        this.$overlay = $('<div id="PopoverMenuOverlay"></div>');

        $('body')
            .append(this.$menu)
            .append(this.$overlay)
        ;

        this.$overlay.on('swiperight click', function(e) { e.preventDefault(); _this.closeMenu(); });
        this.$menu.on('swiperight', function(e) { e.preventDefault(); _this.closeMenu(); });

        resolve();
    }

    // call via something like <a data-action-click="MyApp.PopoverMenu:openMenu">Open hamburger menu</a>
    // (see services/status-bar.js for an example of this)
    openMenu()
    {
        this.$menu.addClass('open');
        this.$overlay.addClass('show');
    }

    closeMenu()
    {
        this.$menu.removeClass('open');
        this.$overlay.removeClass('show');
    }

    navDone(page)
    {
        // when we navigate to another page, close the menu:
        this.closeMenu();
    }
}