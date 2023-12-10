echo "Starting Scraper WebApp"
:: Forcing Flask install just to be safe
python -m pip install Flask==3.0.0
:: Starting webapp on local network 
:: Debug is used to ensure running is seen as requests are made
flask --app scraper_webapp run --debug -h 0.0.0.0
pause