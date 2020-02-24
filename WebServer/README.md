# Demo: Lightning Out + Visualforce/Node.js + LWC/Aura (Node.js Server)

# What is this?
This is one of two repos that will help you get started with **Lightning Out** in Visualforce and Node.js application to render **Lightning Components** both **Aura** and **LWC**.

> This repo contains the Node.js server built using Typescript, express and ejs.

The two GitHub projects are:
- https://github.com/eltoroit/ET_LWC_Out_NodeJS
- https://github.com/eltoroit/ET_LWC_Out_Salesforce

# How to use it?
Make sure you get both repos, then get the scratch org ready and execute the Node.js server.

## How to create the org?
- Create a scratch org by executing this command `./@ELTOROIT/scripts/CreateOrg.sh`
- At the end of that script, it creates the pasword for the user and displays some important information. Make sure you keep that open (if you close it, you can execute `sfdx force:user:display`).
- On the Scratch org that was created, reset the security token for API connections.

# How to configure the Node.js application?
- First, rebuild the **node_modules** folder by executing `npm install`
- Open VS Code and find the `.env` file
- Update the content using the information at the end of the script that creates the scrach org and the security token.
-  Start the web server, by hitting `F5`
- Once it has compiled, open a web browser and navigate to either `http://localhost:5000` or `https://localhost:5001`

**Note:** The Node.js web server is using a self-signed certificate which is required for HTTPS, but obviously is not secured. When you open the "secured" site, the browser is going to report a warning but you can bypass it and get to the content. When you deploy this to a real server, and use a good certificate, this problem will not happen any more.

# Why am I doing this?
Great question...

First of all, I am very excited about everything that came out on Summer '19 around LWC, specially Lighting Out because my site (http://ELTORO.IT) was build using this many years ago with Aura.

Second, it was a bit more difficult than I had thought... specially because there is not a lot of information and I used quite a long list of technologies (Node.js, Typescript, express, ejs, SSL certificates, Lightning out, ...) to put this together. I just want to share this solution with you, and hopefully help you save all the time I spent putting this together.

### Note
This uses two GitHub projects:
- https://github.com/eltoroit/ET_LWC_Out_NodeJS
- https://github.com/eltoroit/ET_LWC_Out_Salesforce

# Credits
Web documents that I read to help me build this:

### Typescript with Node and Express
- https://medium.com/javascript-in-plain-english/typescript-with-node-and-express-js-why-when-and-how-eb6bc73edd5d
- https://code.visualstudio.com/docs/typescript/typescript-debugging
- https://ejs.co/

### Lightning Out
- https://www.jitendrazaa.com/blog/salesforce/use-lightning-components-on-external-websites-lightning-out/ (and his repo https://github.com/JitendraZaa/Lightning-Out-Demo)
- https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-top-summer-19-features-for-admins-and-developers.html
- https://www.salesforcecodecrack.com/2019/05/how-to-call-lightning-web-components.html
- https://releasenotes.docs.salesforce.com/en-us/summer19/release-notes/rn_lwc_vf.htm?edition=&impact=
- https://newstechnologystuff.com/2019/05/28/use-lightning-web-components-in-lightning-out/

### SSL Certificates
- https://www.sslshopper.com/ssl-converter.html
- https://www.sslshopper.com/article-most-common-openssl-commands.html
- https://knowledge.digicert.com/generalinformation/INFO4448.html
- https://www.digitalocean.com/community/tutorials/openssl-essentials-working-with-ssl-certificates-private-keys-and-csrs
- Free certificates: https://letsencrypt.org/about/