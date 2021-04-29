chessComURL = "https://api.chess.com/pub"

archives    = [];
archiveList = [];
games       = [];
counter     = 0;
allGames    = [];

function start() {
    resetData();
    startFunction(getArchives, "Fetching data from chess.com");
}

function resetData() {
    archives    = [];
    archiveList = [];
    games       = [];
    counter     = 0;
    allGames    = [];
}

function getArchives() {
    var username = document.getElementById("myInput").value;
    archiveList = JSON.parse(downloadArchives(username))["archives"];
    startFunction(getGames, `Downloading game archive 1 of ${archiveList.length}`);
}

function getGames() {
    archives.push(JSON.parse(httpCall(archiveList[counter], false))["games"]);
    counter = counter + 1
    if (counter < archiveList.length){
        startFunction(getGames, `Downloading game archive ${counter + 1} of ${archiveList.length}`);
    }else {
        counter = 0;
        archiveList = [];
        startFunction(processArchive, `Processing game archive ${counter + 1} of ${archives.length}`);
    }
}

function processArchive() {
    archives[counter].forEach(game => {
        if (game["time_class"] != "daily" && game["rules"] == "chess"){
            calculateGameDuration(game);
            deleteUnneccesaryData(game);
            allGames.push(game);
        }
    })
    counter = counter + 1
    document.getElementById("ingameTime").innerHTML = Math.round(sumGameTime(allGames) / 3600);
    document.getElementById("gamesPlayed").innerHTML = allGames.length;
    if (counter < archives.length){
        startFunction(processArchive, `Processing game archive ${counter + 1} of ${archives.length}`);
    }else{
        archives = []
        setStatusTo("");
    }
}

function startFunction(callback, status, args = null, delay = 10) {
    setStatusTo(status);
    if (args != null) {
        callback.apply(this, args);
    }
    setTimeout(callback, delay)
}

function setStatusTo(status) {
    document.getElementById("statusField").innerHTML = status;
}

function sumGameTime(games) {
    timeInHours = 0.0
    games.forEach(game => {
        timeInHours = timeInHours + game["durationSeconds"]
    })
    return timeInHours;
}

function downloadArchives(username) {
    return httpCall(url=`${chessComURL}/player/${username}/games/archives`, async=false);
}

function httpCall(url, async) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, async ); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function calculateGameDuration(game) {
    var startTimePatter = new RegExp('StartTime \"\\d\\d:\\d\\d:\\d\\d');
    var endTimePatter   = new RegExp('EndTime \"\\d\\d:\\d\\d:\\d\\d');
    var startDatePatter = new RegExp('Date \"\\d\\d\\d\\d.\\d\\d.\\d\\d');
    var endDatePatter   = new RegExp('EndDate \"\\d\\d\\d\\d.\\d\\d.\\d\\d');
    var startTime   = startTimePatter.exec(game["pgn"])[0].substr(11, 8).split(':');
    var endTime     = endTimePatter.exec(game["pgn"])[0].substr(9, 8).split(':');
    var startDate   = startDatePatter.exec(game["pgn"])[0].substr(6, 10).split('.');
    var endDate     = endDatePatter.exec(game["pgn"])[0].substr(9, 10).split('.');
    var start = new Date(startDate[0], startDate[1]-1, startDate[2], startTime[0], startTime[1], startTime[2]);
    var end   = new Date(endDate[0], endDate[1]-1, endDate[2], endTime[0], endTime[1], endTime[2]);
    var dif = Math.abs(end - start) / 1000;
    game["durationSeconds"] = dif;
}

function deleteUnneccesaryData(game) {
    delete game["pgn"];
    delete game["fen"];
    delete game["url"];
}