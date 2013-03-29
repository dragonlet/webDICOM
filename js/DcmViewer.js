
function DcmViewer(canvasId) {
    this.canvasId = canvasId;
    this.painter = new CanvasPainter(this.canvasId);
    this.toolbox = new Toolbox(this.painter);
    this.scrollIndex = 0;
    this.eventsEnabled = false;
    this.numFiles = 0;
}

DcmViewer.prototype.setCurrentTool = function(toolName) {
    this.toolbox.setCurrentTool(toolName);
};

DcmViewer.prototype.setParsedFiles = function(files) {
    this.numFiles = files.length;
    this.painter.setSeries(files);
    this.painter.drawImg();
    this.eventsEnabled = true;
    var self = this;
    clearInfo();
    updateInfo(this.painter);
    $("#slider").slider({
        value: 0,
        min: 0,
        max: self.numFiles - 1,
        step: 1,
        slide: function(e, ui) {
            self.scrollOne(ui.value);
        }
    });
};

DcmViewer.prototype.eventHandler = function(e) {
    if(this.eventsEnabled) {
        // Firefox doesn't have the offsetX/offsetY properties -> own calculation
        e.x = !e.offsetX ? (e.pageX - $(e.target).offset().left) : e.offsetX;
        e.y = !e.offsetY ? (e.pageY - $(e.target).offset().top) : e.offsetY;

        // pass the event to the currentTool of the toolbox
        var eventFunc = this.toolbox.currentTool[e.type];
        if(eventFunc) {
            eventFunc(e.x, e.y, this.painter);
        }
    }
};

DcmViewer.prototype.scrollHandler = function(evt) {
    if(this.numFiles > 1 && this.eventsEnabled) {
        evt.preventDefault();
        var e = evt.originalEvent;

        // Firefox uses detail. Chrome and Safari wheelDelta. Normalizing the different units.
        var delta = e.detail ? e.detail : -e.wheelDelta / 3.0;
        this.scrollIndex = (delta >= 1) ? this.scrollIndex + 1 : (delta <= -1) ? this.scrollIndex - 1 : this.scrollIndex;

        // cyclic scrolling
        this.scrollIndex = (this.scrollIndex < 0) ? this.numFiles - 1 : (this.scrollIndex > this.numFiles - 1) ? 0 : this.scrollIndex;

        this.painter.currentFile = this.painter.series[this.scrollIndex];
        this.painter.drawImg();
        return this.scrollIndex;
    }
};

DcmViewer.prototype.scrollOne = function(num) {
    this.scrollIndex = num;
    this.painter.currentFile = this.painter.series[this.scrollIndex];
    this.painter.drawImg();
};

var updateInfo = function(_this) {
    var pName = _this.currentFile.PatientsName ? _this.currentFile.PatientsName : ' - ';
    var pSex = _this.currentFile.PatientsSex ? ' (' + _this.currentFile.PatientsSex + ') ' : ' ';
    var pID = _this.currentFile.PatientID ? _this.currentFile.PatientID : ' - ';
    var x = _this.currentFile.PatientsBirthDate;
    var pDate = '';
    
    if(x) {
        // TODO: check if valid date.
        if(new Date(x.slice(0, 4) + "/" + x.slice(4, 6) + "/" + x.slice(6, 8))) {
            pDate = new Date(x.slice(0, 4) + "/" + x.slice(4, 6) + "/" + x.slice(6, 8)).toLocaleDateString();
            if(_this.currentFile.PatientsAge) {
                pDate += '  ' + _this.currentFile.PatientsAge;
            }
        }
    }

    x = _this.currentFile.SeriesDate;
    var time = _this.currentFile.SeriesTime;
    var sDate = x ? new Date(x.slice(0, 4) + "/" + x.slice(4, 6) + "/" + x.slice(6, 8)).toLocaleDateString() : ' - ';
    sDate += time ? '  ' + time.slice(0, 2) + ':' + time.slice(2, 4) + ':' + time.slice(4, 6) : '';
    var sDesc = _this.currentFile.StudyDescription ? _this.currentFile.StudyDescription : ' - ';

    $('#patientsName').text(pName + pSex + pID);
    $('#age').text(pDate);
    $('#wCenter').text(_this.wc.toFixed(0));
    $('#wWidth').text(_this.ww.toFixed(0));
    $('#studyDate').text(sDate);
    $('#studyDescription').text(sDesc);
};

var clearInfo = function() {
    $('#patientsName').text('');
    $('#age').text('');
    $('#wCenter').text('');
    $('#wWidth').text('');
    $('#studyDate').text('');
    $('#studyDescription').text('');
};