
document.addEventListener('DOMContentLoaded', function() {
    const tbl = document.querySelector("#rec-tbl-body");
    var scraperRuns = [{_id: '1', records_found: '215', run_date: '12/07/2023_23:37:06', search_range_end_date: '12/06/2023', search_range_start_date: '12/06/2023'}];
    var rptTimeInputH = document.querySelector("#rpt-time-hr");
    var rptTimeInputM = document.querySelector("#rpt-time-mm");
    var rptTimeInputAmPm = document.querySelector(".am-pm-switch");
    rptTimeInputAmPm.addEventListener('change', function() {
        console.log("changed: " + rptTimeInputAmPm.checked);
    })
    getScraperRuns();
    var SETTINGS = {};
    get_settings();
    getScraperRuns();
    const clock = document.querySelector("#clock");
    var currTime = moment();
    var scraperRunning = false;
    updateClock();
    const status_icon = document.querySelector('.status-icon');
    const status_txt = document.querySelector('.status-txt');
    var elems = document.querySelectorAll('.scrollspy');
    M.ScrollSpy.init(elems, {});

    const lastDate = moment().format('MM/DD/yyyy');
    const strtDate = moment().subtract(1, 'days').format('MM/DD/yyyy');
    console.log(lastDate);
    console.log(strtDate);
    M.AutoInit();
    var elems = document.querySelectorAll('.datepicker');
    M.Datepicker.init(elems, datepickerOptions);

    var startDatePicker = document.querySelector('#start-date');
    var endDatePicker = document.querySelector('#end-date');
    
    startDatePicker.value = strtDate;
    endDatePicker.value = lastDate;

    var timepickerElem = document.querySelector('.timepicker');
    var timepickerOptions = {
        onCloseEnd: handleRepeatTimeUpdate,
    };
    var timepicker = M.Timepicker.init(timepickerElem, timepickerOptions);
    timepickerOptions.onCloseEnd = handleRepeatTimeUpdate;
    //timepicker.value = moment().format('HH:MM');
    // These two lines update the text field for the timepicker 
    timepicker._updateTimeFromInput();
    timepicker.done();

    var run_scrpr_btn = document.querySelector('#run-scrpr-btn');
    //var clr_dates_btn = document.querySelector('#clr-dates-btn');
    run_scrpr_btn.addEventListener('click', run_scraper);
    //clr_dates_btn.addEventListener('click', clearDatePickerFields);

    
    //timepicker.done();

    

    console.log(moment().format('HH:MM'))
    //get_settings();

    const checkboxes = document.querySelectorAll('.day-sel-checkbox');
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () =>{
            const day = checkbox.parentElement.querySelector('span').innerHTML;
            const val = checkbox.checked;
            const tmp = {};
            tmp[day] = val;
            let data = {
                "days" : tmp,
                "repeat_time": timepicker.value,
            };

            console.log('Setting ' + day + ' to ' + val)

            fetch('/update-settings', {
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "body": JSON.stringify(data),
            })
            .then(get_settings);
        });
    });

    const days = {
        "Monday"   : 0,
        "Tuesday"  : 1,
        "Wednesday": 2,
        "Thursday" : 3,
        "Friday"   : 4,
        "Saturday" : 5,
        "Sunday"   : 6,
    };
    const freq_opts = {
        'Daily': 1,
        'Weekly': 2,
    }

    
    var rpt_opts_dropdwn = document.querySelector('#rpt-options');
    rpt_opts_dropdwn.addEventListener('change', updateRepeatOpts);
    
    var datepickerOptions = {
        format: 'mm/dd/yyyy',
        autoClose : "true",
        firstDay : 1,
        setDefaultDate: true
    };
    
    var timepickerOptions = {
        
    };
    
    var SETTINGS = {};
    
    function get_settings(){
        console.log('attempting settings...');
        $.getJSON('/get-settings', function(data) {
            SETTINGS = data[0];
            console.log("Settings:\n" + typeof(SETTINGS));
            console.log("Retrieved Settings: \n")
            console.log(SETTINGS);

            
            console.log("RepeatTime: " + SETTINGS.repeat_time);
            
            timepicker.time = SETTINGS.repeat_time.split(" ")[0];
            var tmp_time = SETTINGS.repeat_time.split(" ");
            rptTimeInputH.value = parseInt(tmp_time[0].split(":")[0]);
            rptTimeInputM.value = parseInt(tmp_time[0].split(":")[1]);
            if (tmp_time[1].includes("AM")){
                rptTimeInputAmPm.checked = false;
            } else {
                rptTimeInputAmPm.checked = true;
            }
            if (SETTINGS.scraper_running != "False") {
                console.log("Scraper is running: " + SETTINGS.scraper_running);
                setScraperStatus(true);
            } else {
                console.log("Scraper is NOT running: " + SETTINGS.scraper_running);
                setScraperStatus(false);
            }
            
            if (SETTINGS.repeat_time.includes('PM')){
                timepicker.amOrPm = "PM";
            } else {
                timepicker.amOrPm = "AM";
            }
            
            if (SETTINGS.frequency != 'N/A'){
                rpt_opts_dropdwn.value = freq_opts[SETTINGS.frequency];
                if (SETTINGS.frequency === 'Daily'){
                    
                    checkboxes.forEach((box) => {
                        box.checked = true;
                    });
                } else {
                    if (SETTINGS.repeat_days != null){
                        console.log(SETTINGS.repeat_days);
                        for (rday in days){
                            console.log(rday);
                            console.log(typeof(SETTINGS["repeat_days"]));
                            console.log(SETTINGS["repeat_days"].includes(rday));
                            if (SETTINGS["repeat_days"].includes(rday)){
                                checkboxes[days[rday]].checked = true;
                            } else {
                                checkboxes[days[rday]].checked = false;
                            }
                        }
                    } else {
                        checkboxes.forEach((box) => {
                            box.checked = false;
                        });
                    }
                }
            }
            
        })
        .then(getScraperRuns);
    }

    
    
    function handleRepeatTimeUpdate (){
        let newTime = timepicker.time + " " + timepicker.amOrPm;
        console.log('changing repeat time to: ' + newTime);
        fetch('/update-settings', {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": JSON.stringify({"repeat_time":newTime}),
        })
        .then(get_settings);
    }
    
    
    function updateRepeatOpts(){
        const idx = rpt_opts_dropdwn.value;
        opt = document.querySelectorAll('option')[idx];
        console.log("opt_txt: " + opt.text);
        if (opt.text === 'Daily') {
            checkboxes.forEach((box) => {
                box.checked = true;
            })
        }
        
        let data = {
            "frequency" : opt.text,
            "repeat_time": timepicker.value,
        };
        
        fetch('/update-settings', {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "body": JSON.stringify(data),
        })
        .then(get_settings);
    }
    
    function updateClock(){
        currTime = moment();
        const timer = {
            'dd': currTime.format('dddd'), 
            'DD': currTime.format('DD'), 
            'hh': currTime.format('hh'), 
            'mm': currTime.format('mm'), 
            'MM': currTime.format('MMM'),
            'ss': currTime.format('ss'),
            'YY': currTime.format('YYYY'),
            'ap': currTime.format('a').toUpperCase()
        };
        
        const cmpr_dt = timer.DD + "/" + timer.mm + "/" + timer.YY + ":" + timer.hh + ":" + timer.mm + ":" + timer.ss;
        const trig_tm = timer.hh +":" + timer.mm + " " + timer.ap;

        //console.log('Scraper Running: ' + scraperRunning + "; repeat time: " + SETTINGS.repeat_time + "; repeat Days: " + SETTINGS.repeat_days);
        //console.log('trigger time: ' + trig_tm);
        //console.log('same: ' + (trig_tm === SETTINGS.repeat_time));
        if (Object.keys(SETTINGS).length === 0){
            console.log("empty settings");
        } else if (!scraperRunning & SETTINGS.repeat_days.includes(timer.dd) & 
        trig_tm === SETTINGS.repeat_time) {
            console.log("checking " + scraperRuns[0].run_date + " v " + cmpr_dt);
            if (scraperRuns[0].run_date != cmpr_dt){
                console.log("=============")
                console.log('trigger alarm');
                run_scraper();
            }
        }
        const datetime = currTime.format("hh:mm:ss a MMM Do, YYYY");
        clock.innerHTML = datetime;
        setTimeout(updateClock, 1000);
    }
    
    function run_scraper(){
        console.log("running scraper");
        console.log(startDatePicker.value);
        console.log(endDatePicker.value);
        
        setScraperStatus(true);
        const url = "../run-scraper?start=" + startDatePicker.value + "&end=" + endDatePicker.value;
        $.getJSON( url,
            function(data) {
            console.log(data);
            console.log("finished scraper run");
            setScraperStatus(false);
        })
        .then(get_settings);
    }
    
    function setScraperStatus(state){
        console.log("setting scraper status to: " + state);
        var tmp = status_icon.getAttribute('class');
        if (state) {
            scraperRunning = true;
            tmp = tmp.replace(' inactive', ' active');
            status_icon.setAttribute('class', tmp);
            status_txt.innerHTML = status_txt.innerHTML.replace('Not Running', 'Running')
            run_scrpr_btn.disabled = true;
        } else {
            scraperRunning = false;
            tmp = tmp.replace(' active', ' inactive');
            status_icon.setAttribute('class', tmp);
            if (!status_txt.innerHTML.includes('Not Running')){
                status_txt.innerHTML = status_txt.innerHTML.replace('Running', 'Not Running')
            }
            run_scrpr_btn.disabled = false;
        }
    }

    function getScraperRuns(){
        tbl.innerHTML = '';
        console.log("Getting Scraper Runs...");
        console.log(scraperRuns);
        $.getJSON("/get-scraper-runs", function(data) {
            console.log('scraper_data======================');
            scraperRuns = data;
            
            for (run of scraperRuns){
                var row = document.createElement("tr");
                var td1 = document.createElement('td');
                var td2 = document.createElement('td');
                var td3 = document.createElement('td');
                var td4 = document.createElement('td');
                td1.innerHTML = run.run_date;
                td2.innerHTML = run.search_range_start_date;
                td3.innerHTML = run.search_range_end_date;
                td4.innerHTML = run.records_found;
                row.appendChild(td1);
                row.appendChild(td2);
                row.appendChild(td3);
                row.appendChild(td4);
                tbl.appendChild(row);
            }
        });
    }
});