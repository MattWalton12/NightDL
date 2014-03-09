NightDL
=======

A simple node application for scheduling downloads, for the bandwidth impaired

###Prerequisites
You must first have Node and NPM intalled, if you do not please install it from http://nodejs.org.

###Setting up the server
Navigate into the server directory, and run the command `npm install`, this will then install all the dependencies required for NightDL server.

After the dependencies have installed, simply start the server using `node server`, by default the server will run on port 1338. You should now be able to navigate to the web interface.

Additional configuration options, such as the port, web base URL and time to run the downloads can be found in config.json.

###Setting up the client
NightDL includes a very basic client, that will grab the files from the server when run, and transfer them to a directory of your choosing.

Navigate into the client directory, and run the command `npm install`, this will then install all the dependencies required for NightDL client.

You then need to modify client-config.json , and set the url to the address of your NightDL server, the location parameter is where the files will be transferred to.

###API documentation
Coming soon!

