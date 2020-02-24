# Statistics

| Test            | Number Records | First |   All |
| --------------- | :------------: | ----: | ----: |
| Heroku          |       5        | 0.066 | 0.117 |
| Localhost       |       5        | 0.089 | 0.113 |
| Platform Events |       5        | 0.371 | 0.451 |
| Heroku          |       50       | 0.058 | 0.338 |
| Localhost       |       50       | 0.051 | 0.591 |
| Platform Events |       50       | 0.333 |  6.58 |

# Notes

The CSP only gets applied after logging into the org with all the metadata pushed.

# Lessons Learned

-   How to convert to a service components
-   How to have children components be the rows in a table
-   How to organize the code now that @track is not required.
    -   How to have private/untracked variables.
-	Redis
	-	Heroku dynos storage
	-	Inter-dyno communication
	-	Command prompt
-	Event emitter

