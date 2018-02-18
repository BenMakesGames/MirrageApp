class About
{
    get id() { return 'MyApp.About'; }

    constructor()
    {
        this.template = `
            <h2>About</h2>
            <p>This is my app. I hope you like it.</p>
            <p><a data-back>&lt; Back</a></p>
        `;
    }

    open(resolve, reject)
    {
        this.data = {
            /*
             * add template data here, ex:
             *   user: { name: 'Ben' },
             *   message: 'Hello',
             */
        };

        resolve();
    }
}
