fotoramaDefaults = {
    width: '100%',
    height: '100%',
    ratio: 16 / 9,
    allowfullscreen: 'native',
    nav: 'thumbs',
    click: false,
    transition: 'crossfade',
    keyboard: {
        space: true,
        end: true,
        home: true,
        up: true,
        down: true
    }
}
let $fotorama = $('.fotorama').fotorama(),
    fotorama = $fotorama.data('fotorama'),
    allowedExt = [".jpeg", ".jpg", ".png", ".gif"],
    aft = null,
    uname = "",
    params = '';
let dataCalled = {
    val: false,
    onChange: [],
    set: function (val) {
        if (val != this.val && this.onChange.length) {
            this.onChange.forEach(changeEv => {
                changeEv(val);
            });
        }
        this.val = val;
    },
    get: function () {
        return this.val;
    },
    setOnChange: function (ev) {
        this.onChange.push(ev);
    }
}
dataCalled.setOnChange(function (val) {
    if (val) {
        $('.loader').show();
    } else {
        $('.loader').hide();
    }
});
$('.fotorama').on('fotorama:showend', function (e, fotorama, extra) {
    if ((fotorama.size - fotorama.activeIndex) <= 5) {
        fetchSlides();
    }
});
$(document).ready(function () {
    if (location.hash.length > 0) {
        username = location.hash.substr(1);
        let res = nameFixes(username);
        document.title = res.title +
            " - " + document.title;
        uname = res.name;
        fetchSlides();
    } else {
        swal.fire({
            title: 'Enter Reddit name',
            text: 'e.g. u/xyz or r/all',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: !1,
            confirmButtonText: 'Go',
            showLoaderOnConfirm: !0,
            preConfirm: (username) => {
                location.hash = "#" + username;
                let res = nameFixes(username);
                username = res.name;
                document.title = res.title +
                    " - " + document.title;
                uname = username;
                if (username && username.match(
                        /user\/[\d\w]+|r\/[\d\w]+/g)) {
                    return fetch(
                        `https://www.reddit.com/${username}/.json?limit=15&after=${aft}${params}`
                    ).then(response => {
                        if (!response.ok) {
                            throw new Error(response.status)
                        }
                        return response.json()
                    }).catch(error => {
                        Swal.showValidationMessage(
                            `Request failed: ${error}`)
                    })
                } else {
                    if (!username) {
                        Swal.showValidationMessage(
                            `Name field cannot be empty!`);
                    } else {
                        Swal.showValidationMessage(
                            `Invalid format, please provide Reddit name as u/xyz or r/xyz`
                        );
                    }
                }
            },
            allowOutsideClick: () => 0
        }).then((data) => {
            data = data.value;
            if (data.error) {
                Swal.showValidationMessage(`Request failed: ${data.message}`)
            } else if (data.data && data.data.children && data.data.children
                .length > 0) {
                addSlides(data)
            } else {
                Swal.showValidationMessage(
                    "Request failed: No posts found for this user")
            }
        })
    }
    window.onhashchange = function () {
        location.reload();
    }
    $(document).on('click', 'div.fotorama__stage__frame img.fotorama__img', function () {
        let img = $(this).clone().removeClass().removeAttr('style');
        $('#imageZoomContent').html(img);
        if ((this.height < this.width) && (window.screen.width < window.screen.height)) {
            $('#imageZoomContent img').addClass('rotated');
            $('#imageZoomContent img').css('maxWidth', '100vh');
        }
        panzoom($('#imageZoomContent')[0]);
        $('#imageZoom').modal('toggle');
    });
    $(document).on('click', 'a#home', function () {
        window.location = location.href.substr(0, location.href.lastIndexOf('#'));
    });
});
function addSlides(data) {
    $('a#home').show();
    data = data.data;
    aft = data.after ? data.after : 'EOF';
    let postArr = [];
    data.children.length > 0 &&
        data.children.forEach((post) => {
            post = post.data;
            let m = post.url.match(/\.\w{3,4}$/m);
            if (post.url && m && allowedExt.includes(m[0])) {
                postArr.push(post)
            }
        });
    postArr.length && postArr.forEach((post) => {
        fotorama.push({
            img: post.url,
            thumb: post.preview && post.preview.images[0].resolutions[0].url.replace(/\&amp;/g,
                '&'),
            caption: post.title
        });
    });
    if (aft == "EOF") {
        fotorama.push({
            html: '<div style="text-align: center;position: relative;top: 150px;"><h1>THE END<h1></div>'
        });
    };
    dataCalled.set(false);
    postArr.length < 3 && fetchSlides();
}
function fetchSlides() {
    if (aft != 'EOF' && !dataCalled.get()) {
        dataCalled.set(true);
        fetch(`https://www.reddit.com/${uname}/.json?limit=15&after=${aft}${params}`).then(response => {
            if (!response.ok) {
                throw new Error(response.status)
            }
            return response.json()
        }).then(data => addSlides(data)).catch(error => {
            alert(`Request failed: ${error}`);
        })
    }
}
function nameFixes(name) {
    name = name.replace(/\s+/g, '');
    if (name.substr(0, 1) == '/') {
        name = name.substr(1);
    }
    if (name.substr(0, 2) == 'u/') {
        name = "user/" + name.substr(2);
    }
    if (name.substr(0, 5) == 'user/') {
        name = name + '/submitted';
        params = "&sort=new";
    }
    if (name.substr(0, 2) == 'm/') {
        name = "user/" + name.substr(2);
    }
    if (name.indexOf('?') > 0) {
        let arr = name.split('?');
        name = arr[0];
        params += "&" + arr[1];
    }
    return {
        name: name,
        title: ucfirst(name.substr(name.indexOf('/') + 1)) +
            " - " + document.title
    }
}
function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}