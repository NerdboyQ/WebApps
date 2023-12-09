import json
import os
import sys
import time
from flask import render_template, jsonify, url_for, Response, request, stream_with_context
from scraper_webapp.scripts.MarylandEstates_Scraper import *
from scraper_webapp import app, db
from scraper_webapp.models import *

CURR_SETTINGS = None

@app.route("/")
def render_homepage():
    """
    Default homepage
    """
    print("rendering template")
    db.session.commit()
    return render_template("index.html")

@app.route("/get-scraper-runs")
def get_scraper_runs():
    print("Running query for scraper runs...")
    records = []
    db_records = ScraperRun.query.all()
    for rec in db_records:
        #print(rec.data)
        j = json.loads(rec.data)
        records.append(j)
    
    records.reverse()
    return jsonify(records)

@app.route("/run-scraper", methods=['GET'])
def req_scraper():
    print("Running Scraper")
    print("*"*70)
    _state = Settings.query.get(0)
    _state.scraper_running = True
    db.session.commit()
    
    print(request.args.to_dict())
    # test line
    # scraper_results = {'run_date': '12/08/2023_16:48:00', 'rec_cnt': 102}
    # time.sleep(30)
    scraper_results = asyncio.run(run_scraper(startDate=request.args['start'], endDate=request.args['end']))
    print(f"Scraper record count: {scraper_results}")
    
    _state = Settings.query.get(0)
    _state.scraper_running = False
    db.session.commit()
    rec = ScraperRun(run_date=scraper_results['run_date'],search_range_start_date=request.args['start'],search_range_end_date=request.args['end'],records_found=scraper_results['rec_cnt'])
    db.session.add(rec)
    db.session.commit()
    print("Record added")
    print("*"*70)
    return jsonify(scraper_results)

@app.route("/update-settings", methods=['GET','POST'])
def update_settings():
    print("req:", request.json)
    rec = Settings.query.get(0)
    if "repeat_time" in request.json:
        print(f" Setting the repeat_time: {request.json['repeat_time']}")
        rec.repeat_time = request.json["repeat_time"]
        db.session.commit()

    if "frequency" in request.json:
        print(f" Setting the frequency: {request.json['frequency']}")
        val = request.json['frequency']

        rec.frequency = val
        if val == 'Daily':
            rec.repeat_days = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
        else:
            rec.repeat_days = ""

        db.session.commit()

    else:

        if "days" in request.json:
            day = list(request.json['days'].keys())[0]
            val = request.json['days'][day]
            if day not in rec.repeat_days and val:
                print(f" adding {day}")
                if rec.repeat_days == "":
                    rec.repeat_days = day
                else:
                    rec.repeat_days += f",{day}"
                
                if rec.repeat_days.count(',') == 6:
                    rec.frequency = "Daily"
                else:
                    rec.frequency = "Weekly"

                db.session.commit()
            elif day in rec.repeat_days and not val:
                print(f" removing {day}")
                tmp = rec.repeat_days
                rec.frequency = "Weekly"
                if tmp == day:
                    tmp = ""
                else:
                    tmp = tmp.split(",")
                    tmp.remove(day)
                    if len(tmp) == 1:
                        tmp = tmp[0]
                    else:
                        tmp = ",".join(tmp)

                rec.repeat_days = tmp
                db.session.commit()

    print(rec.data)
    
    return jsonify({'status' : 'success'})

@app.route("/get-settings", methods=['GET'])
def get_curr_settings():
    CURR_SETTINGS = Settings.query.filter_by(_id=0).first()
    CURR_SETTINGS = CURR_SETTINGS.data
    CURR_SETTINGS = json.loads(CURR_SETTINGS)
    return jsonify([CURR_SETTINGS])
