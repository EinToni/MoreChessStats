chessComURL = "https://api.chess.com/pub"

function searchForUser(){
    // Todo: Show Loading circle or spinner
    var username = document.getElementById("myInput").value;
    var archives = JSON.parse(getArchives(username))["archives"];
    var allGames = []
    archives.forEach(url => {
        var answere = JSON.parse(httpCall(url, false))["games"];
        answere.forEach(element => {
            if (element["time_class"] != "daily" && element["rules"] == "chess"){
                calculateGameDuration(element);
                deleteUnneccesaryData(element);
                allGames.push(element);
            }
        })
    });
    document.getElementById("ingameTime").innerHTML = Math.round(sumGameTime(allGames) / 3600);
}

function sumGameTime(games) {
    timeInHours = 0.0
    games.forEach(game => {
        timeInHours = timeInHours + game["durationSeconds"]
    })
    return timeInHours;
}

function getArchives(username) {
    return httpCall(url=`${chessComURL}/player/${username}/games/archives`, async=false);
}

function httpCall(url, async) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, async ); // false for synchronous request
    xmlHttp.send( null );
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