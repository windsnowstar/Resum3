async function getUserProfiles(){
    const address = localStorage.getItem("_account_");
    let loading = showLoading('Processing', 'Loading...');
    $.ajax({
        url: "/userProfiles?address="+ address,
        data:{},
        type:"GET",
        success: function(data){
            loading.close();
            $("#profiles").html(data);
        }
    });
}

async function getAllProfiles(){
    let loading = showLoading('Processing', 'Loading...');
    $.ajax({
        url: "/allProfiles",
        data:{},
        type:"GET",
        success: function(data){
            loading.close();
            $("#allProfiles").html(data);
        }
    });
}

async function createProfile(){
    let m = $('#profileModel');
    m.find('.x-title').text('Create profile');
    $('#profileModel').modal('show');
}

async function doCreate(){
    let accessToken = await getLatestAccessToken();
    let profileName = $('#profileNameInput').val();
    console.log(`/createProfile?accessToken=${accessToken}&profileName=${profileName}`);

    let loading = showLoading('Processing', 'Processing....');
    $.ajax({
        url: `/createProfile?accessToken=${accessToken}&profileName=${profileName}`,
        data:{},
        async: false,
        type:"GET",
        success: function(data){
            console.log("data:" , data)
            loading.close();
            showInfo('Success', 'Create profile success, txHash:'+data);
        }
    });
}