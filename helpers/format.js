var formatSettings = (request, callback) => {

    var userInfo = {
        profile_name: request.profile_name,
        profile_id: request.profile_id,
        mac_address: request.mac_address,
        home_address: request.home_address,
        work_address: request.work_address
    }

    var calendar = {
        event_name: request.event_name,
        cal_action: request.cal_action,
    }

    var isHome = {
        on_off: request.on_off,
        color: request.color,
        brightness: request.brightness
    }

    var settings = {
        calendar_settings: calendar,
        is_home_settings: isHome
    }

    var user = {
        userInfo: userInfo,
        settings: settings
    }
    callback(user);
}

module.exports = {
    formatSettings
}