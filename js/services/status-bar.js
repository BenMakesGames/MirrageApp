class StatusBar
{
    get id() { return 'MyApp.StatusBar'; }

    init(resolve, reject)
    {
        this.$header = $('body > header');
        this.$statusBar = $('<div id="StatusBar"></div>');

        this.$header.append(this.$statusBar);

        this.template = `
            <nav>
                <a class="hamburger" href="#" data-action-click="MyApp.PopoverMenu:openMenu">&equiv;</a>
            </nav>
        `;

        this.refresh();

        resolve();
    }

    redraw()
    {
        if(typeof this.$template === 'undefined')
            this.$template = this.app.renderer.createTemplate(this.template);

        this.$statusBar.html(this.app.renderer.renderTemplate(this.$template, this.data));
    }

    refresh()
    {
        this.data = {
        };

        this.redraw();
    }

    navDone(page)
    {
        // add "this.hideStatusbar = true;" to a page's constructor to hide the status bar on the page

        if(typeof page.hideStatusbar === 'undefined' || !page.hideStatusbar)
            this.$header.find('> #StatusBar').css('display', 'block');
        else
            this.$header.find('> #StatusBar').css('display', 'none');
    }
}