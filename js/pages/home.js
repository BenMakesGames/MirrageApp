class Home
{
    get id() { return 'MyApp.Home'; }

    constructor()
    {
        this.template = `
            <h2>Home</h2>
            <!--
            if you're using underscore or lodash, you can access page data (see the "open" method, below) like this:
            
            <p>Hello, <%= rc.user.name %>.</p>
            <% if(rc.message) { %>
                <p class="message"><%= rc.message %>.</p>
            <% } %>
            
            note the funny "rc" prefix when accessing your data. it's an underscore/lodash thing.
            -->
        `;
    }

    open(resolve, reject)
    {
        this.data = {
            /*
             * add template data here, ex:
             *   user: { name: 'Ben' },
             *   message: null,
             */
        };

        // if you don't resolve() or reject(), the loading throbber will display forever!
        resolve();
    }

    // adds pull-to-refresh to the page
    refresh(resolve, reject)
    {
        /*
         * in theory, you'd modify this.data somehow; ex:
         *
         *   this.data.message = 'You refreshed the page!';
         */

        resolve();
    }
}
