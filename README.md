# Twitter search API demo

This app is educational and demonstrates basic use of twitter search api.

App follows some topics discussed on twitter and visualizes the trends.



## To run project on local machine

You need to have installed on local machine => `git`, `docker` and `docker-compose`
Additionally you will need to get `TWITTER_API_KEY` and `TWITTER_API_SECRET` parameter values.
Parameters can be retrieved [twitter developer](https://developer.twitter.com) 
portal (must sign up and register new twitter app). 

Get the source code

    git clone https://github.com/zukalt/twitter-api-demo.git

Edit `docker-compose.yml` file to update TWITTER_API_KEY` and `TWITTER_API_SECRET` 
environment variables

    cd twitter-api-demo
    docker-compose up
    
Then open browser to access:
- Landing page http://localhost:3000
- Swagger docs UI for api http://localhost:3000/swagger
- Mongo express to what's in the database http://localhost:8081


## Important Note

On first run scraper will try to load as early tweets as possible. As the number of tweets is quite big
this initial run can take couple of days to complete (due to API rate limitation).

You can stop the containers by `Ctrl+C` and then run again. 
On next run scraper will not try to fill only the gap between last run and current, and will soon load
all missed tweets and continue in normal flow.

 
