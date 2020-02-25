# Lessons Learned

-   There is a delay for applying the CSP rules. It's not immediatly after the push!
-   Service components requires the metadata file even if the component does not use LWC (does not extend nor import)
-   Children components can be the rows in a table, if the CSS if applied `:host {display: contents;}`
-   How to organize the code now that @track is not required.
    -   How to have private/untracked variables.
-   Redis
    -   Two use cases
        -   Heroku inter-dyno storage
        -   Inter-dyno communication
    -   Can be queried via Command prompt
-   Event emitter for events in Node.js
