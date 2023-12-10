from scraper_webapp import db, app

def cleanRecordForJson(d: dict):
    d.pop(list(d.keys())[0])
    for k, v in d.items():
        if type(v) != str:
            d[k] = str(v)

    return str(d).replace("'","\"") 

class Settings(db.Model):
    _id = db.Column(db.String(120), nullable=False, primary_key=True)
    frequency = db.Column(db.String(120), nullable=False, default="")
    repeat_days = db.Column(db.String(120), nullable=False, default="")
    repeat_range = db.Column(db.Integer, nullable=False, default=1)
    repeat_time = db.Column(db.String(120), nullable=False, default="")
    scraper_running = db.Column(db.Boolean, nullable=False, default=False)

    @property
    def data(self):
        return cleanRecordForJson(self.__dict__)


class ScraperRun(db.Model):
    _id = db.Column(db.Integer, nullable=False, primary_key=True)
    run_date = db.Column(db.String(120), nullable=False)
    search_range_start_date = db.Column(db.String(120), nullable=False)
    search_range_end_date = db.Column(db.String(120), nullable=False)
    records_found = db.Column(db.String(120), nullable=False)

    @property
    def data(self):
        return cleanRecordForJson(self.__dict__)
    
with app.app_context():
    db.create_all()
    _state = Settings.query.get(0)
    _state.scraper_running = False
    db.session.commit()