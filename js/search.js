chessComURL = "https://api.chess.com/pub"

gameTimes = ["rapid", "bullet", "blitz"]
gameData = {};
counter  = 0;

function start() {
    resetData();
    startFunction(getArchives, "Fetching data from chess.com");
}

function resetData() {
    
    gameData             = {};
    gameData.archiveList = [];
    gameData.archives    = [];
    gameData.times       = {};
    gameTimes.forEach(time => {
        gameData.times[time] = {"win": 0, "lose": 0, "draw": 0, "time": 0, "games": []}
    })
    counter              = 0;
}

function getArchives() {
    var username = document.getElementById("myInput").value;
    gameData.username = username;
    gameData.archiveList = JSON.parse(downloadArchives(username))["archives"];
    startFunction(getGames, `Downloading game archive 1 of ${gameData.archiveList.length}`);
}

function getGames() {
    gameData.archives.push(JSON.parse(httpCall(gameData.archiveList[counter], false))["games"]);
    counter = counter + 1
    if (counter < gameData.archiveList.length){
        startFunction(getGames, `Downloading game archive ${counter + 1} of ${gameData.archiveList.length}`);
    }else {
        counter = 0;
        gameData.archiveList = [];
        startFunction(processArchive, `Processing game archive ${counter + 1} of ${gameData.archives.length}`);
    }
}

function processArchive() {
    gameData.archives[counter].forEach(game => {
        if (game["time_class"] != "daily" && game["rules"] == "chess"){
            calculateGameDuration(game);
            deleteUnneccesaryData(game);
            gameData.times[game["time_class"]].time = gameData.times[game["time_class"]].time + game["durationSeconds"];
            gameData.times[game["time_class"]].games.push(game);
        }
    })
    counter = counter + 1
    document.getElementById("ingameTime").innerHTML = sumGameTime(gameData.times);
    gamesplayed = 0;
    Object.values(gameData.times).forEach(time => {
        gamesplayed = gamesplayed + time["games"].length
    })
    document.getElementById("gamesPlayed").innerHTML = gamesplayed;
    if (counter < gameData.archives.length){
        startFunction(processArchive, `Processing game archive ${counter + 1} of ${gameData.archives.length}`);
    }else{
        gameData.archives = []
        setStatusTo("");
        updatePie();
        document.getElementById("username").innerHTML = gameData.username;
        var ingametime = sumGameTime(gameData.times);
        if ( ingametime > 24) {
            document.getElementById("ingameTime").innerHTML = ingametime + `  (~ ${(ingametime/24).toFixed(2)} days)`
        }
    }
}

function updatePie() {
    updateTimePie();
    updateGamesPlayedPie();
}

function updateGamesPlayedPie() {
    var ctx = document.getElementById("gamesPlayedPie");
    var myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: gameTimes,
          datasets: [{
            data: [
                Math.round(gameData.times[gameTimes[0]].games.length), 
                Math.round(gameData.times[gameTimes[1]].games.length), 
                Math.round(gameData.times[gameTimes[2]].games.length)],
            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
            hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
            hoverBorderColor: "rgba(234, 236, 244, 1)",
          }],
        },
        options: {
          maintainAspectRatio: false,
          tooltips: {
            backgroundColor: "rgb(255,255,255)",
            bodyFontColor: "#858796",
            borderColor: '#dddfeb',
            borderWidth: 1,
            xPadding: 15,
            yPadding: 15,
            displayColors: false,
            caretPadding: 10,
          },
          legend: {
            display: true
          },
          cutoutPercentage: 80,
        },
      });
}


function updateTimePie() {
    var ctx = document.getElementById("timePie");
    var myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: gameTimes,
          datasets: [{
            data: [
                Math.round(gameData.times[gameTimes[0]].time / 3600), 
                Math.round(gameData.times[gameTimes[1]].time / 3600), 
                Math.round(gameData.times[gameTimes[2]].time / 3600)],
            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
            hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf'],
            hoverBorderColor: "rgba(234, 236, 244, 1)",
          }],
        },
        options: {
          maintainAspectRatio: false,
          tooltips: {
            backgroundColor: "rgb(255,255,255)",
            bodyFontColor: "#858796",
            borderColor: '#dddfeb',
            borderWidth: 1,
            xPadding: 15,
            yPadding: 15,
            displayColors: false,
            caretPadding: 10,
          },
          legend: {
            display: true
          },
          cutoutPercentage: 80,
        },
      });
}

function isGameWon(game) {
    if (game.black.username == gameData.username){
        return (game.black.result == "win");
    } else {
        return (game.black.result != "win");
    }
}

function startFunction(callback, status, delay = 10) {
    setStatusTo(status);
    setTimeout(callback, delay);
}

function setStatusTo(status) {
    document.getElementById("statusField").innerHTML = status;
}

function sumGameTime(timeclasses) {
    timeInSeconds = 0.0
    Object.values(timeclasses).forEach(time => {
        timeInSeconds = timeInSeconds + time["time"]
    })
    return (timeInSeconds / 3600).toFixed(2);
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