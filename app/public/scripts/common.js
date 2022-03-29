async function getLatestAccessToken(){
    let address = localStorage.getItem("_account_");
    let accessToken = localStorage.getItem("accessToken");
    let accessTokenExpire = localStorage.getItem("accessTokenExpire");
    let refreshToken = localStorage.getItem("refreshToken");
    let refreshTokenExpire = localStorage.getItem("refreshTokenExpire");

    if(accessToken && parseInt(accessTokenExpire) > new Date().getTime()){
        console.log("token is valid and return " , accessToken)
        return accessToken;
    }

    if(refreshToken && parseInt(refreshTokenExpire) > new Date().getTime()){
        $.ajax({
            url: "/refreshAccessToken?refreshToken="+ refreshToken,
            data:{},
            async: false,
            type:"GET",
            success: function(data){
                console.log("refreshAccessToken result:" , data)
                localStorage.setItem("accessToken", data.split("____")[0]);
                localStorage.setItem("refreshToken",  data.split("____")[1]);
                localStorage.setItem("accessTokenExpire", new Date().getTime() + 1000 * 5 * 60);
                localStorage.setItem("refreshTokenExpire", new Date().getTime() + 1000 * 24 * 60 * 60);
                accessToken = data.split("____")[0];
            }
        });
        console.log("refreshAccessToken and return " , accessToken)
        return accessToken;
    }else{
        let chanllengeText = "";
        $.ajax({
            url: "/generateChallenge?address="+ address,
            data:{},
            async: false,
            type:"GET",
            success: function(data){
                console.log("data:" , data)
                chanllengeText = data;
            }
        });

        console.log("chanllengeText:",chanllengeText)
        const signText = await window.getWeb3Provider().getSigner().signMessage(chanllengeText);
        console.log("signText: " + signText);

        $.ajax({
            url: "/authenticate?address="+ address +"&sign=" +signText,
            data:{},
            sync: false,
            type:"GET",
            success: function(data){
                console.log("authenticate:" , data)
                localStorage.setItem("accessToken", data.split("____")[0]);
                localStorage.setItem("refreshToken",  data.split("____")[1]);
                localStorage.setItem("accessTokenExpire", new Date().getTime() + 1000 * 5 * 60);
                localStorage.setItem("refreshTokenExpire", new Date().getTime() + 1000 * 24 * 60 * 60);
                accessToken = data.split("____")[0];
            },
            error: function(error){
                alert(error);
            }
        });

        console.log("authenticate and return accessToken" , accessToken)
        return accessToken;

    }

}

function getWeb3Provider() {
    if (!window.web3Provider) {
        if (!window.ethereum) {
            console.error("there is no web3 provider.");
            return null;
        }
        window.web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    return window.web3Provider;
}


function showAlert(title, message) {
    let m = $('#alertModal');
    m.find('.x-title').text(title);
    m.find('.x-message').text(message);
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    myModal.show();
}

function showInfo(title, message) {
    let m = $('#infoModal');
    m.find('.x-title').text(title);
    m.find('.x-message').text(message);
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    myModal.show();
}

function showLoading(title, message) {
    let m = $('#loadingModal');
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    let obj = {
        setTitle: (t) => {
            m.find('.x-title').text(t);
        },
        setMessage: (t) => {
            m.find('.x-message').text(t);
        },
        close: () => {
            setTimeout(function () {
                myModal.hide();
            }, 500);
        }
    }
    obj.setTitle(title);
    obj.setMessage(message);
    myModal.show();
    return obj;
}

function translateError(err) {
    window.err = err;
    if (typeof (err) === 'string') {
        return err;
    }
    if (err.error && err.error.code && err.error.message) {
        return `Error (${err.error.code}): ${err.error.message}`;
    }
    if (err.code && err.message) {
        return `Error (${err.code}): ${err.message}`;
    }
    return err.message || err.toString();
}

function logoutGithub(){
    localStorage.setItem("_user.userName", "");
    window.location.reload();
}