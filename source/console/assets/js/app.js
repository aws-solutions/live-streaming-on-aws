'us strict'

//Set endpoints
const hls_url = exports.hls_manifest;
const dash_url = exports.dash_manifest;
const mss_url = exports.mss_manifest;
const cmaf_url = exports.cmaf_manifest;

//Links
document.getElementById('live').href = exports.mediaLiveConsole;
document.getElementById('hls').innerHTML = '<a href="'+hls_url+'">'+hls_url+'</a>';
document.getElementById('dash').innerHTML = '<a href="'+dash_url+'">'+dash_url+'</a>';
document.getElementById('mss').innerHTML = '<a href="'+mss_url+'">'+mss_url+'</a>';
document.getElementById('cmaf').innerHTML = '<a href="'+cmaf_url+'">'+cmaf_url+'</a>';

function loadHls() {
	let player = videojs('video');
	player.src({
		src: hls_url,
		type: 'application/x-mpegURL'
	});
	player.play()
	document.getElementById('stream').innerHTML = 'Now Playing the HLS Stream';
}

function loadDash() {
	let player = videojs('video');
	player.src({
		src: dash_url,
		type: 'application/dash+xml'
	});
	player.play()
	document.getElementById('stream').innerHTML = 'Now Playing the DASH Stream';
}

function loadMss() {

	let mPlayer = new MediaPlayer();
	mPlayer.init(document.querySelector('video'));
	mPlayer.load({
		url: mss_url
	});
	document.getElementById('stream').innerHTML = 'Now Playing the Microsoft Smooth Stream';
}

function loadCmaf() {
	if (player){
		player.reset();
	}
	else let player = videojs('video');
	player.src({
		src: cmaf_url,
		type: 'application/x-mpegURL'
	});
	player.play()
	document.getElementById('stream').innerHTML = 'Now Playing the CMAF Stream';
}
