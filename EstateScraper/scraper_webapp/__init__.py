from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
# Uses __init__.py file for app configuration
#app.config.from_object('config')
# Database setup
basedir = os.path.abspath(os.path.dirname(__file__))

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'scraper.db') # Creates table
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # ignores any warning messages
db = SQLAlchemy(app)

from scraper_webapp import views, models
