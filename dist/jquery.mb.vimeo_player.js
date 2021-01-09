/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
 jquery.mb.components
 
 file: jquery.mb.vimeo_player.src.js
 last modified: 10/25/18 8:00 PM
 Version:  1.2.0
 Build:  567
 
 Open Lab s.r.l., Florence - Italy
 email:  matteo@open-lab.com
 blog: 	http://pupunzi.open-lab.com
 site: 	http://pupunzi.com
 	http://open-lab.com
 
 Licences: MIT, GPL
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html

 Copyright (c) 2001-2018. Matteo Bicocchi (Pupunzi)


  https://help.vimeo.com/hc/en-us/articles/360001494447-Using-Player-Parameters
  https://help.vimeo.com/hc/en-us/articles/360037761072-Bandwidth-on-Vimeo-
  https://help.vimeo.com/hc/en-us/articles/224968848-Playback-quality-and-buffering-issues
 :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/


let get_vimeo_videoID = function (url) {

	let videoID;
	if (url.indexOf('vimeo.com') > 0) {
		videoID = url.substr(url.lastIndexOf('/') + 1, url.length)
	} else {
		videoID = url.length > 15 ? null : url
	}

	return videoID
};


(function ($) {
	jQuery.vimeo_player = {
		name    : 'jquery.mb.vimeo_player',
		author  : 'Matteo Bicocchi (pupunzi)',
		version : '1.2.0',
		build   : '567',
		defaults: {
			containment        : 'body',
			ratio              : 16 / 9, // "16/9" or "4/3"
			videoURL           : null,
			quality            : "1080p",//4K, 2K, 1080p, 720p, 540p, 360p and 240p
			startAt            : 0,
			stopAt             : 0,
			autoPlay           : true,
			fadeTime           : 1000,
			vol                : 5, // 1 to 10
			addRaster          : false,
			opacity            : 1,
			mute               : true,
			loop               : true,
			showControls       : true,
			show_vimeo_logo    : true,
			stopMovieOnBlur    : true,
			realfullscreen     : true,
			playOnMobile       : true,
			playsinline        : true,
			mobileFallbackImage: null,
			gaTrack            : false,
			optimizeDisplay    : true,
			mask               : false,
			align              : 'center,center', // top,bottom,left,right
			onReady            : function (player) {
			}
		},
		/**
		 *  @fontface icons
		 *  */
		controls: {
			play      : 'P',
			pause     : 'p',
			mute      : 'M',
			unmute    : 'A',
			fullscreen: 'O',
			showSite  : 'R',
			logo      : 'V'
		},

		/**
		 *
		 */
		buildPlayer: function (options) {
			//console.time("Vimeo_start")
			let isIframe = function () {
				let isIfr = false;
				try {
					if (self.location.href != top.location.href) isIfr = true
				} catch (e) {
					isIfr = true
				}
				return isIfr
			};

			let script = document.createElement('script');
			script.src = '//player.vimeo.com/api/player.js';
			script.onload = function () {
				jQuery(document).trigger('vimeo_api_loaded')
			};
			document.head.appendChild(script);

			return this.each(function () {

				let vimeo_player = this;
				let VEvent;
				let $vimeo_player = jQuery(vimeo_player);
				vimeo_player.loop = 0;
				vimeo_player.opt = {};
				vimeo_player.state = {};
				vimeo_player.id = vimeo_player.id || 'YTP_' + new Date().getTime();
				$vimeo_player.addClass('vimeo_player');

				let property = $vimeo_player.data('property') && typeof $vimeo_player.data('property') == 'string' ? eval('(' + $vimeo_player.data('property') + ')') : $vimeo_player.data('property');

				jQuery.extend(vimeo_player.opt, jQuery.vimeo_player.defaults, options, property);
				vimeo_player.opt.ratio = vimeo_player.opt.ratio == 'auto' ? 16 / 9 : vimeo_player.opt.ratio;

				if (eval(vimeo_player.opt.loop))
					vimeo_player.opt.loop = 9999;

				vimeo_player.isRetina = (window.retina || window.devicePixelRatio > 1);

				vimeo_player.canGoFullScreen = !(jQuery.browser.msie || jQuery.browser.opera || isIframe());
				if (!vimeo_player.canGoFullScreen) vimeo_player.opt.realfullscreen = false;

				vimeo_player.isAlone = false;
				vimeo_player.hasFocus = true;

				vimeo_player.videoID = this.opt.videoURL ? get_vimeo_videoID(this.opt.videoURL) : $vimeo_player.attr('href') ? get_vimeo_videoID($vimeo_player.attr('href')) : false;
				vimeo_player.isSelf = vimeo_player.opt.containment == 'self';

				vimeo_player.opt.containment = vimeo_player.opt.containment == 'self' ? jQuery(this) : jQuery(vimeo_player.opt.containment);
				vimeo_player.opt.vol = vimeo_player.opt.vol / 10;

				vimeo_player.isBackground = vimeo_player.opt.containment.is('body');

				if (vimeo_player.isBackground && vimeo_player.backgroundIsInited)
					return;

				vimeo_player.playOnMobile = (vimeo_player.opt.playOnMobile && jQuery.browser.mobile);

				if (!vimeo_player.isSelf) {
					$vimeo_player.hide()
				}

				let overlay = jQuery('<div/>').css({
					position: 'absolute',
					top     : 0,
					left    : 0,
					width   : '100%',
					height  : '100%'
				}).addClass('vimeo_player_overlay');

				if (vimeo_player.isSelf) {
					overlay.on('click', function () {
						$vimeo_player.togglePlay()
					})
				}

				let playerID = 'vimeo_player_' + vimeo_player.id;

				let wrapper = jQuery('<div/>').addClass('vimeo_player_wrapper').attr('id', 'vimeo_player_wrapper_' + playerID);
				wrapper.css({
					position: 'absolute',
					zIndex  : 0,
					width   : '100%',
					height  : '100%',
					left    : 0,
					top     : 0,
					overflow: 'hidden',
					opacity : 0
				});

				vimeo_player.wrapper = wrapper;
				vimeo_player.opt.containment.prepend(wrapper);

				if (vimeo_player.opt.mobileFallbackImage && jQuery.browser.mobile) {

					wrapper.css({
						backgroundImage   : 'url(' + vimeo_player.opt.mobileFallbackImage + ')',
						backgroundPosition: 'center center',
						backgroundSize    : 'cover',
						backgroundRepeat  : 'no-repeat',
						opacity           : 1
					});

					setTimeout(function () {
						VEvent = jQuery.Event('VPFallback');
						$vimeo_player.trigger(VEvent)
					}, 1000);

					$vimeo_player.hide();
					return $vimeo_player
				}

				vimeo_player.opt.containment.children().not('script, style').each(function () {
					if (jQuery(this).css('position') == 'static') jQuery(this).css('position', 'relative')
				});

				if (vimeo_player.isBackground) {
					jQuery('body').css({
						boxSizing: 'border-box'
					});

					wrapper.css({
						position: 'fixed',
						top     : 0,
						left    : 0,
						zIndex  : 0
					})

				} else if (vimeo_player.opt.containment.css('position') == 'static')
					vimeo_player.opt.containment.css({
						position: 'relative'
					});

				vimeo_player.videoWrapper = wrapper;
				vimeo_player.overlay = overlay;

				if (!vimeo_player.isBackground) {
					overlay.on('mouseenter', function () {
						if (vimeo_player.controlBar && vimeo_player.controlBar.length)
							vimeo_player.controlBar.addClass('visible')
					}).on('mouseleave', function () {
						if (vimeo_player.controlBar && vimeo_player.controlBar.length)
							vimeo_player.controlBar.removeClass('visible')
					})
				}

				jQuery(document).on('vimeo_api_loaded', function () {

					let vURL = '//player.vimeo.com/video/' + vimeo_player.videoID;
					//vimeo_player.opt.videoURL
					//https://github.com/vimeo/player.js#embed-options
					let options = {
						id         : vURL,
						muted      : vimeo_player.opt.mute ? 1 : 0,
						background : 1,
						quality    : vimeo_player.opt.quality,
						autoplay   : vimeo_player.playOnMobile ? 1 : 0,
						playsinline: vimeo_player.playOnMobile ? 1 : 0
					};

					// console.debug(options);

					vimeo_player.player = new Vimeo.Player(vimeo_player.videoWrapper.get(0).id, options);
					vimeo_player.player.ready().then(function () {
						vimeo_player.playerBox = vimeo_player.videoWrapper.find('iframe');
						vimeo_player.playerBox.after(overlay);

						function start() {
							vimeo_player.isReady = true;
							if (vimeo_player.opt.mute) {
								setTimeout(function () {
									$vimeo_player.v_mute()
								}, 1)
							}

							if (vimeo_player.opt.showControls)
								jQuery.vimeo_player.buildControls(vimeo_player);

							if (vimeo_player.opt.autoPlay) {
								if (!vimeo_player.playOnMobile) {
									setTimeout(function () {
										vimeo_player.player.pause();
										$vimeo_player.v_play();
										VEvent = jQuery.Event('VPStart');
										$vimeo_player.trigger(VEvent);
										$vimeo_player.v_optimize_display()
									}, vimeo_player.opt.fadeTime)
								} else {
									setTimeout(function () {
										VEvent = jQuery.Event('VPStart');
										$vimeo_player.trigger(VEvent);
										vimeo_player.videoWrapper.fadeTo(vimeo_player.opt.fadeTime, vimeo_player.opt.opacity)
									}, 1000)
								}
							} else {
								$vimeo_player.v_pause()
							}


							VEvent = jQuery.Event('VPReady');
							VEvent.opt = vimeo_player.opt;
							$vimeo_player.trigger(VEvent);

							if (typeof vimeo_player.opt.onReady == 'function')
								vimeo_player.opt.onReady(vimeo_player);

							$vimeo_player.v_optimize_display()
						}

						if (vimeo_player.opt.startAt) {
							vimeo_player.player.play().then(function () {
								vimeo_player.player.pause()
							});
							$vimeo_player.v_seekTo(vimeo_player.opt.startAt, function () {
								start()
							})
						} else {
							start()
						}

						jQuery(window).off('resize.vimeo_player_' + vimeo_player.id).on('resize.vimeo_player_' + vimeo_player.id, function () {
							clearTimeout(vimeo_player.optimizeD);
							vimeo_player.optimizeD = setTimeout(function () {
								$vimeo_player.v_optimize_display()
							}, 250)
						});

						//PROGRESS
						vimeo_player.player.on('progress', function (data) {
							VEvent = jQuery.Event('VPProgress');
							VEvent.data = data;
							$vimeo_player.trigger(VEvent)

						});

						//ERROR
						vimeo_player.player.on('error', function (data) {
							vimeo_player.state = -1;
							//console.debug( "error:: ", data );
							// Trigger state events
							VEvent = jQuery.Event('VPError');
							VEvent.error = data;
							$vimeo_player.trigger(VEvent)
						});

						//PLAY
						vimeo_player.player.on('play', function (data) {
							vimeo_player.state = 1;
							$vimeo_player.trigger('change_state');

							if (vimeo_player.controlBar && vimeo_player.controlBar.length)
								vimeo_player.controlBar.find('.vimeo_player_pause').html(jQuery.vimeo_player.controls.pause);

							if (typeof _gaq != 'undefined' && eval(vimeo_player.opt.gaTrack)) _gaq.push(['_trackEvent', 'vimeo_player', 'Play', vimeo_player.videoID]);
							if (typeof ga != 'undefined' && eval(vimeo_player.opt.gaTrack)) ga('send', 'event', 'vimeo_player', 'play', vimeo_player.videoID);

							// Trigger state events
							VEvent = jQuery.Event('VPPlay');
							VEvent.error = data;
							$vimeo_player.trigger(VEvent);

							//Add raster image
							if (vimeo_player.opt.addRaster) {
								let classN = vimeo_player.opt.addRaster == 'dot' ? 'raster-dot' : 'raster';
								vimeo_player.overlay.addClass(vimeo_player.isRetina ? classN + ' retina' : classN)
							} else {
								vimeo_player.overlay.removeClass(function (index, classNames) {
									// change the list into an array
									let current_classes = classNames.split(' '),
											// array of classes which are to be removed
											classes_to_remove = [];
									jQuery.each(current_classes, function (index, class_name) {
										// if the classname begins with bg add it to the classes_to_remove array
										if (/raster.*/.test(class_name)) {
											classes_to_remove.push(class_name)
										}
									});
									classes_to_remove.push('retina');
									// turn the array back into a string
									return classes_to_remove.join(' ')
								})
							}

						});

						//PAUSE
						vimeo_player.player.on('pause', function (data) {
							vimeo_player.state = 2;
							$vimeo_player.trigger('change_state');

							if (vimeo_player.controlBar && vimeo_player.controlBar.length)
								vimeo_player.controlBar.find('.vimeo_player_pause').html(jQuery.vimeo_player.controls.play);

							VEvent = jQuery.Event('VPPause');
							VEvent.time = data;
							$vimeo_player.trigger(VEvent)

						});

						//SEEKED
						vimeo_player.player.on('seeked', function (data) {
							vimeo_player.state = 3;
							$vimeo_player.trigger('change_state')
						});

						//ENDED
						vimeo_player.player.on('ended', function (data) {
							vimeo_player.state = 0;
							$vimeo_player.trigger('change_state');

							VEvent = jQuery.Event('VPEnd');
							VEvent.time = data;
							$vimeo_player.trigger(VEvent)

						});

						//TIME UPDATE
						vimeo_player.player.on('timeupdate', function (data) {

							vimeo_player.duration = data.duration;
							vimeo_player.percent = data.percent;
							vimeo_player.seconds = data.seconds;

							vimeo_player.state = 1;
							vimeo_player.player.getPaused().then(function (paused) {
								if (paused)
									vimeo_player.state = 2
							});

							if (vimeo_player.opt.stopMovieOnBlur) {
								if (!document.hasFocus()) {
									if (vimeo_player.state == 1) {
										vimeo_player.hasFocus = false;
										$vimeo_player.v_pause();
										vimeo_player.document_focus = setInterval(function () {
											if (document.hasFocus() && !vimeo_player.hasFocus) {
												vimeo_player.hasFocus = true;
												$vimeo_player.v_play();
												clearInterval(vimeo_player.document_focus)
											}
										}, 300)
									}
								}
							}

							if (vimeo_player.opt.showControls) {
								let controls = jQuery('#controlBar_' + vimeo_player.id);
								let progressBar = controls.find('.vimeo_player_pogress');
								let loadedBar = controls.find('.vimeo_player_loaded');
								let timeBar = controls.find('.vimeo_player_seek_bar');
								let totW = progressBar.outerWidth();
								let currentTime = Math.floor(data.seconds);
								let totalTime = Math.floor(data.duration);
								let timeW = (currentTime * totW) / totalTime;
								let startLeft = 0;
								let loadedW = data.percent * 100;
								loadedBar.css({
									left : startLeft,
									width: loadedW + '%'
								});
								timeBar.css({
									left : 0,
									width: timeW
								});

								if (data.duration) {
									vimeo_player.controlBar.find('.vimeo_player_time').html(jQuery.vimeo_player.formatTime(data.seconds) + ' / ' + jQuery.vimeo_player.formatTime(data.duration))
								} else {
									vimeo_player.controlBar.find('.vimeo_player_time').html('-- : -- / -- : --')
								}
							}

							vimeo_player.opt.stopAt = vimeo_player.opt.stopAt > data.duration ? data.duration - 0.5 : vimeo_player.opt.stopAt;
							let end_time = vimeo_player.opt.stopAt || data.duration - 0.5;

							if (data.seconds >= end_time) {

								vimeo_player.loop = vimeo_player.loop || 0;

								if (vimeo_player.opt.loop && vimeo_player.loop < vimeo_player.opt.loop) {
									$vimeo_player.v_seekTo(vimeo_player.opt.startAt);
									vimeo_player.loop++

								} else {
									$vimeo_player.v_pause();
									vimeo_player.state = 0;
									$vimeo_player.trigger('change_state')
								}
							}

							// Trigger state events
							VEvent = jQuery.Event('VPTime');
							VEvent.time = data.seconds;
							$vimeo_player.trigger(VEvent)

						})
					});

					$vimeo_player.on('change_state', function () {
						if (vimeo_player.state === 0)
							vimeo_player.videoWrapper.fadeOut(vimeo_player.opt.fadeTime, function () {
								$vimeo_player.v_seekTo(0)
							})
					})
				})
			})
		},
		/**
		 *
		 * @param s
		 * @returns {string}
		 */
		formatTime : function (s) {
			let min = Math.floor(s / 60);
			let sec = Math.floor(s - (60 * min));
			return (min <= 9 ? '0' + min : min) + ' : ' + (sec <= 9 ? '0' + sec : sec)
		},

		play: function () {
			let vimeo_player = this.get(0);
			if (!vimeo_player.isReady)
				return this;

			vimeo_player.player.pause();
			vimeo_player.player.play();
			setTimeout(function () {
				vimeo_player.videoWrapper.fadeTo(vimeo_player.opt.fadeTime, vimeo_player.opt.opacity)
				//console.timeEnd("Vimeo_start");
			}, 1000);

			let controls = jQuery('#controlBar_' + vimeo_player.id);

			if (controls.length) {
				let playBtn = controls.find('.mb_YTPPvimeo_player_playpause');
				playBtn.html(jQuery.vimeo_player.controls.pause)
			}
			vimeo_player.state = 1;

			jQuery(vimeo_player).css('background-image', 'none');
			return this
		},

		togglePlay: function (callback) {
			let vimeo_player = this.get(0);
			if (vimeo_player.state === 1)
				this.v_pause();
			else
				this.v_play();

			if (typeof callback == 'function')
				callback(vimeo_player.state);

			return this
		},

		pause: function () {
			let vimeo_player = this.get(0);
			vimeo_player.player.pause();
			vimeo_player.state = 2;
			return this
		},

		seekTo: function (val, callback) {
			let vimeo_player = this.get(0);

			let seekTo = vimeo_player.opt.stopAt && (val >= vimeo_player.opt.stopAt) ? vimeo_player.opt.stopAt - 0.5 : val;

			vimeo_player.player.setCurrentTime(seekTo).then(function (data) {
				if (typeof callback == 'function')
					callback(data)
			});
			return this
		},

		setVolume: function (val) {
			let vimeo_player = this.get(0);
			vimeo_player.isMute = false;
			vimeo_player.opt.vol = val || vimeo_player.opt.vol;
			vimeo_player.player.setVolume(vimeo_player.opt.vol);

			if (vimeo_player.volumeBar && vimeo_player.volumeBar.length)
				vimeo_player.volumeBar.updateSliderVal(val * 100);
			return this
		},

		toggleVolume: function () {
			let vimeo_player = this.get(0);
			if (!vimeo_player) return;

			if (vimeo_player.isMute) {
				jQuery(vimeo_player).v_unmute();
				return true
			} else {
				jQuery(vimeo_player).v_mute();
				return false
			}
		},

		mute: function () {
			let vimeo_player = this.get(0);

			if (vimeo_player.isMute)
				return this;

			if (vimeo_player.playOnMobile) {
				vimeo_player.player.toggleMute()
			}

			vimeo_player.isMute = true;
			vimeo_player.player.setVolume(0);

			if (vimeo_player.volumeBar && vimeo_player.volumeBar.length && vimeo_player.volumeBar.width() > 10) {
				vimeo_player.volumeBar.updateSliderVal(0)
			}

			let controls = jQuery('#controlBar_' + vimeo_player.id);
			let muteBtn = controls.find('.vimeo_player_muteUnmute');
			muteBtn.html(jQuery.vimeo_player.controls.unmute);

			jQuery(vimeo_player).addClass('isMuted');

			if (vimeo_player.volumeBar && vimeo_player.volumeBar.length)
				vimeo_player.volumeBar.addClass('muted');

			return this
		},

		unmute       : function () {
			let vimeo_player = this.get(0);

			if (!vimeo_player.isMute)
				return;

			vimeo_player.isMute = false;

			if (vimeo_player.playOnMobile) {
				vimeo_player.player.toggleMute()
			}

			jQuery(vimeo_player).v_set_volume(vimeo_player.opt.vol);
			if (vimeo_player.volumeBar && vimeo_player.volumeBar.length) vimeo_player.volumeBar.updateSliderVal(vimeo_player.opt.vol > .1 ? vimeo_player.opt.vol : .1);
			let controls = jQuery('#controlBar_' + vimeo_player.id);
			let muteBtn = controls.find('.vimeo_player_muteUnmute');
			muteBtn.html(jQuery.vimeo_player.controls.mute);
			jQuery(vimeo_player).removeClass('isMuted');
			if (vimeo_player.volumeBar && vimeo_player.volumeBar.length)
				vimeo_player.volumeBar.removeClass('muted');

			return this
		},
		/**
		 * playerDestroy
		 * @returns {jQuery.mbYTPlayer}
		 */
		playerDestroy: function () {
			let vimeo_player = this.get(0);
			if (!vimeo_player.isReady)
				return this;

			vimeo_player.player.destroy().then(function () {
				// the player was destroyed
				vimeo_player.loop = 0;
				vimeo_player.opt = {};
				vimeo_player.state = {};
				vimeo_player.wrapper.remove();
				jQuery('#controlBar_' + vimeo_player.id).remove();
				clearInterval(vimeo_player.document_focus)

			}).catch(function (error) {
				// an error occurred
				console.error('Vimeo_player could not be destroyed. The error is: ' + error)
			});

			return this
		},

		changeMovie: function (obj) {
			let $vimeo_player = this;
			let vimeo_player = $vimeo_player.get(0);
			vimeo_player.opt.startAt = 0;
			vimeo_player.opt.stopAt = 0;
			vimeo_player.opt.mask = false;
			vimeo_player.opt.mute = true;
			vimeo_player.hasData = false;
			vimeo_player.hasChanged = true;
			vimeo_player.player.loopTime = undefined;

			if (obj)
				jQuery.extend(vimeo_player.opt, obj);

			if (vimeo_player.opt.loop || vimeo_player.opt.loop === 'true')
				vimeo_player.opt.loop = 9999;

			vimeo_player.player.loadVideo(obj.videoURL).then(function (id) {
				$vimeo_player.v_optimize_display();
				jQuery(vimeo_player).v_play();
				if (vimeo_player.opt.startAt)
					$vimeo_player.v_seekTo(vimeo_player.opt.startAt)
			})
		},

		buildControls: function (vimeo_player) {
			let data = vimeo_player.opt;

			if (jQuery('#controlBar_' + vimeo_player.id).length)
				return;

			vimeo_player.controlBar = jQuery('<span/>').attr('id', 'controlBar_' + vimeo_player.id).addClass('vimeo_player_bar').css({
				whiteSpace: 'noWrap',
				position  : vimeo_player.isBackground ? 'fixed' : 'absolute',
				zIndex    : vimeo_player.isBackground ? 10000 : 1000
			});
			let buttonBar = jQuery('<div/>').addClass('buttonBar');
			/* play/pause button*/
			let playpause = jQuery('<span>' + jQuery.vimeo_player.controls.play + '</span>').addClass('vimeo_player_pause vimeo_icon').click(function () {
				if (vimeo_player.state === 1) jQuery(vimeo_player).v_pause();
				else jQuery(vimeo_player).v_play()
			});
			/* mute/unmute button*/
			let MuteUnmute = jQuery('<span>' + jQuery.vimeo_player.controls.mute + '</span>').addClass('vimeo_player_muteUnmute vimeo_icon').click(function () {

				if (vimeo_player.isMute) {
					jQuery(vimeo_player).v_unmute()
				} else {
					jQuery(vimeo_player).v_mute()
				}
			});
			/* volume bar*/
			let volumeBar = jQuery('<div/>').addClass('vimeo_player_volume_bar').css({
				display: 'inline-block'
			});
			vimeo_player.volumeBar = volumeBar;
			/* time elapsed */
			let idx = jQuery('<span/>').addClass('vimeo_player_time');
			let vURL = 'https://vimeo.com/' + vimeo_player.videoID;

			let movieUrl = jQuery('<span/>').html(jQuery.vimeo_player.controls.logo).addClass('vimeo_url vimeo_icon').attr('title', 'view on Vimeo').on('click', function () {
				window.open(vURL, 'viewOnVimeo')
			});

			let fullscreen = jQuery('<span/>').html(jQuery.vimeo_player.controls.fullscreen).addClass('vimeo_fullscreen vimeo_icon').on('click', function () {
				jQuery(vimeo_player).v_fullscreen(data.realfullscreen)
			});
			let progressBar = jQuery('<div/>').addClass('vimeo_player_pogress').css('position', 'absolute').click(function (e) {
				timeBar.css({
					width: (e.clientX - timeBar.offset().left)
				});

				vimeo_player.timeW = e.clientX - timeBar.offset().left;

				vimeo_player.controlBar.find('.vimeo_player_loaded').css({
					width: 0
				});
				let totalTime = Math.floor(vimeo_player.duration);
				vimeo_player.goto = (timeBar.outerWidth() * totalTime) / progressBar.outerWidth();

				jQuery(vimeo_player).v_seekTo(parseFloat(vimeo_player.goto));

				vimeo_player.controlBar.find('.vimeo_player_loaded').css({
					width: 0
				})
			});

			let loadedBar = jQuery('<div/>').addClass('vimeo_player_loaded').css('position', 'absolute');
			let timeBar = jQuery('<div/>').addClass('vimeo_player_seek_bar').css('position', 'absolute');
			progressBar.append(loadedBar).append(timeBar);
			buttonBar.append(playpause).append(MuteUnmute).append(volumeBar).append(idx);
			if (data.show_vimeo_logo) {
				buttonBar.append(movieUrl)
			}
			if (vimeo_player.isBackground || (eval(vimeo_player.opt.realfullscreen) && !vimeo_player.isBackground)) buttonBar.append(fullscreen);
			vimeo_player.controlBar.append(buttonBar).append(progressBar);
			if (!vimeo_player.isBackground) {
				//vimeo_player.controlBar.addClass( "inline_vimeo_player" );
				vimeo_player.videoWrapper.before(vimeo_player.controlBar)
			} else {
				jQuery('body').after(vimeo_player.controlBar)
			}

			volumeBar.simpleSlider({
				initialval : vimeo_player.opt.vol,
				scale      : 100,
				orientation: 'h',
				callback   : function (el) {
					if (el.value === 0) {
						jQuery(vimeo_player).v_mute()
					} else {
						jQuery(vimeo_player).v_unmute()
					}
					vimeo_player.player.setVolume(el.value / 100);

					if (!vimeo_player.isMute)
						vimeo_player.opt.vol = el.value
				}
			})
		},

		optimizeVimeoDisplay: function (align) {
			let vimeo_player = this.get(0);
			let vid = {};

			vimeo_player.opt.align = align || vimeo_player.opt.align;

			vimeo_player.opt.align = typeof vimeo_player.opt.align != 'undefined ' ? vimeo_player.opt.align : 'center,center';
			let VimeoAlign = vimeo_player.opt.align.split(',');

			if (vimeo_player.opt.optimizeDisplay) {

				let win = {};
				let el = vimeo_player.videoWrapper;
				let abundance = vimeo_player.isPlayer ? 0 : el.outerHeight() * .15;

				win.width = el.outerWidth() + abundance;
				win.height = el.outerHeight() + abundance;

				vimeo_player.opt.ratio = eval(vimeo_player.opt.ratio);

				vid.width = win.width;
				vid.height = Math.ceil(vid.width / vimeo_player.opt.ratio);

				vid.marginTop = Math.ceil(-((vid.height - win.height) / 2));
				vid.marginLeft = 0;

				vimeo_player.playerBox.css({
					top        : 0,
					opacity    : 0,
					width      : 100,
					height     : Math.ceil(100 / vimeo_player.opt.ratio),
					marginTop  : 0,
					marginLeft : 0,
					frameBorder: 0
				});

				let lowest = vid.height < win.height;

				if (lowest) {
					vid.height = win.height;
					vid.width = Math.ceil(vid.height * vimeo_player.opt.ratio);
					vid.marginTop = 0;
					vid.marginLeft = Math.ceil(-((vid.width - win.width) / 2))
				}

				for (let a in VimeoAlign) {

					if (VimeoAlign.hasOwnProperty(a)) {
						let al = VimeoAlign[a].replace(/ /g, '');
						switch (al) {
							case 'top':
								vid.marginTop = lowest ? -((vid.height - win.height) / 2) : 0;
								break;
							case 'bottom':
								vid.marginTop = lowest ? 0 : -(vid.height - win.height);
								break;
							case 'left':
								vid.marginLeft = 0;
								break;
							case 'right':
								vid.marginLeft = lowest ? -(vid.width - win.width) : 0;
								break;
							default:
								if (vid.width > win.width)
									vid.marginLeft = -((vid.width - win.width) / 2);
								break
						}
					}
				}
			} else {
				vid.width = '100%';
				vid.height = '100%';
				vid.marginTop = 0;
				vid.marginLeft = 0
			}
			setTimeout(function () {
				vimeo_player.playerBox.css({
					opacity   : 1,
					width     : vid.width,
					height    : vid.height,
					marginTop : vid.marginTop,
					marginLeft: vid.marginLeft,
					maxWidth  : 'initial'
				})
			}, 10)
		},

		/**
		 *
		 * @param align
		 */
		setAlign: function (align) {
			let $vimeo_player = this;
			$vimeo_player.v_optimize_display(align)
		},

		/**
		 *
		 */
		getAlign: function () {
			let vimeo_player = this.get(0);
			return vimeo_player.opt.align
		},

		/**
		 *
		 * @param real
		 * @returns {jQuery.vimeo_player}
		 */
		fullscreen: function (real) {
			let vimeo_player = this.get(0);
			let $vimeo_player = jQuery(vimeo_player);
			let VEvent;

			if (typeof real == 'undefined') real = vimeo_player.opt.realfullscreen;
			real = eval(real);
			let controls = jQuery('#controlBar_' + vimeo_player.id);
			let fullScreenBtn = controls.find('.vimeo_fullscreen');
			let videoWrapper = vimeo_player.isSelf ? vimeo_player.opt.containment : vimeo_player.videoWrapper;

			if (real) {
				let fullscreenchange = jQuery.browser.mozilla ? 'mozfullscreenchange' : jQuery.browser.webkit ? 'webkitfullscreenchange' : 'fullscreenchange';
				jQuery(document).off(fullscreenchange).on(fullscreenchange, function () {
					let isFullScreen = RunPrefixMethod(document, 'IsFullScreen') || RunPrefixMethod(document, 'FullScreen');
					if (!isFullScreen) {
						vimeo_player.isAlone = false;
						fullScreenBtn.html(jQuery.vimeo_player.controls.fullscreen);
						videoWrapper.removeClass('vimeo_player_Fullscreen');

						videoWrapper.fadeTo(vimeo_player.opt.fadeTime, vimeo_player.opt.opacity);

						videoWrapper.css({
							zIndex: 0
						});

						if (vimeo_player.isBackground) {
							jQuery('body').after(controls)
						} else {
							vimeo_player.videoWrapper.before(controls)
						}
						jQuery(window).resize();
						// Trigger state events
						VEvent = jQuery.Event('VPFullScreenEnd');
						$vimeo_player.trigger(VEvent)

					} else {
						// Trigger state events
						VEvent = jQuery.Event('VPFullScreenStart');
						$vimeo_player.trigger(VEvent)
					}
				})
			}
			if (!vimeo_player.isAlone) {
				function hideMouse() {
					vimeo_player.overlay.css({
						cursor: 'none'
					})
				}

				jQuery(document).on('mousemove.vimeo_player', function (e) {
					vimeo_player.overlay.css({
						cursor: 'auto'
					});
					clearTimeout(vimeo_player.hideCursor);
					if (!jQuery(e.target).parents().is('.vimeo_player_bar'))
						vimeo_player.hideCursor = setTimeout(hideMouse, 3000)
				});

				hideMouse();

				if (real) {
					videoWrapper.css({
						opacity: 0
					});
					videoWrapper.addClass('vimeo_player_Fullscreen');
					launchFullscreen(videoWrapper.get(0));
					setTimeout(function () {
						videoWrapper.fadeTo(vimeo_player.opt.fadeTime, 1);
						vimeo_player.videoWrapper.append(controls);
						jQuery(vimeo_player).v_optimize_display()

					}, 500)
				} else videoWrapper.css({
					zIndex: 10000
				}).fadeTo(vimeo_player.opt.fadeTime, 1);
				fullScreenBtn.html(jQuery.vimeo_player.controls.showSite);
				vimeo_player.isAlone = true
			} else {
				jQuery(document).off('mousemove.vimeo_player');
				clearTimeout(vimeo_player.hideCursor);
				vimeo_player.overlay.css({
					cursor: 'auto'
				});
				if (real) {
					cancelFullscreen()
				} else {
					videoWrapper.fadeTo(vimeo_player.opt.fadeTime, vimeo_player.opt.opacity).css({
						zIndex: 0
					})
				}
				fullScreenBtn.html(jQuery.vimeo_player.controls.fullscreen);
				vimeo_player.isAlone = false
			}

			function RunPrefixMethod(obj, method) {
				let pfx = ['webkit', 'moz', 'ms', 'o', ''];
				let p = 0,
						m, t;
				while (p < pfx.length && !obj[m]) {
					m = method;
					if (pfx[p] == '') {
						m = m.substr(0, 1).toLowerCase() + m.substr(1)
					}
					m = pfx[p] + m;
					t = typeof obj[m];
					if (t != 'undefined') {
						pfx = [pfx[p]];
						return (t == 'function' ? obj[m]() : obj[m])
					}
					p++
				}
			}

			function launchFullscreen(element) {
				RunPrefixMethod(element, 'RequestFullScreen')
			}

			function cancelFullscreen() {
				if (RunPrefixMethod(document, 'FullScreen') || RunPrefixMethod(document, 'IsFullScreen')) {
					RunPrefixMethod(document, 'CancelFullScreen')
				}
			}

			return this
		}
	};

	jQuery.fn.vimeo_player = jQuery.vimeo_player.buildPlayer;
	jQuery.fn.v_play = jQuery.vimeo_player.play;
	jQuery.fn.v_toggle_play = jQuery.vimeo_player.togglePlay;
	jQuery.fn.v_change_movie = jQuery.vimeo_player.changeMovie;
	jQuery.fn.v_pause = jQuery.vimeo_player.pause;
	jQuery.fn.v_seekTo = jQuery.vimeo_player.seekTo;
	jQuery.fn.v_optimize_display = jQuery.vimeo_player.optimizeVimeoDisplay;
	jQuery.fn.v_set_align = jQuery.vimeo_player.setAlign;
	jQuery.fn.v_get_align = jQuery.vimeo_player.getAlign;
	jQuery.fn.v_fullscreen = jQuery.vimeo_player.fullscreen;
	jQuery.fn.v_mute = jQuery.vimeo_player.mute;
	jQuery.fn.v_unmute = jQuery.vimeo_player.unmute;
	jQuery.fn.v_set_volume = jQuery.vimeo_player.setVolume;
	jQuery.fn.v_toggle_volume = jQuery.vimeo_player.toggleVolume

})(jQuery);
;/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.browser.min.js                                                                                                                   _
 _ last modified: 24/05/17 19.56                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matbicoc@gmail.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2017. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/
var nAgt=navigator.userAgent;jQuery.browser=jQuery.browser||{};jQuery.browser.mozilla=!1;jQuery.browser.webkit=!1;jQuery.browser.opera=!1;jQuery.browser.safari=!1;jQuery.browser.chrome=!1;jQuery.browser.androidStock=!1;jQuery.browser.msie=!1;jQuery.browser.edge=!1;jQuery.browser.ua=nAgt;function isTouchSupported(){var a=nAgt.msMaxTouchPoints,e="ontouchstart"in document.createElement("div");return a||e?!0:!1}
var getOS=function(){var a={version:"Unknown version",name:"Unknown OS"};-1!=navigator.appVersion.indexOf("Win")&&(a.name="Windows");-1!=navigator.appVersion.indexOf("Mac")&&0>navigator.appVersion.indexOf("Mobile")&&(a.name="Mac");-1!=navigator.appVersion.indexOf("Linux")&&(a.name="Linux");/Mac OS X/.test(nAgt)&&!/Mobile/.test(nAgt)&&(a.version=/Mac OS X ([\._\d]+)/.exec(nAgt)[1],a.version=a.version.replace(/_/g,".").substring(0,5));/Windows/.test(nAgt)&&(a.version="Unknown.Unknown");/Windows NT 5.1/.test(nAgt)&&
(a.version="5.1");/Windows NT 6.0/.test(nAgt)&&(a.version="6.0");/Windows NT 6.1/.test(nAgt)&&(a.version="6.1");/Windows NT 6.2/.test(nAgt)&&(a.version="6.2");/Windows NT 10.0/.test(nAgt)&&(a.version="10.0");/Linux/.test(nAgt)&&/Linux/.test(nAgt)&&(a.version="Unknown.Unknown");a.name=a.name.toLowerCase();a.major_version="Unknown";a.minor_version="Unknown";"Unknown.Unknown"!=a.version&&(a.major_version=parseFloat(a.version.split(".")[0]),a.minor_version=parseFloat(a.version.split(".")[1]));return a};
jQuery.browser.os=getOS();jQuery.browser.hasTouch=isTouchSupported();jQuery.browser.name=navigator.appName;jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion);jQuery.browser.majorVersion=parseInt(navigator.appVersion,10);var nameOffset,verOffset,ix;
if(-1!=(verOffset=nAgt.indexOf("Opera")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+6),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8));else if(-1!=(verOffset=nAgt.indexOf("OPR")))jQuery.browser.opera=!0,jQuery.browser.name="Opera",jQuery.browser.fullVersion=nAgt.substring(verOffset+4);else if(-1!=(verOffset=nAgt.indexOf("MSIE")))jQuery.browser.msie=!0,jQuery.browser.name="Microsoft Internet Explorer",
	jQuery.browser.fullVersion=nAgt.substring(verOffset+5);else if(-1!=nAgt.indexOf("Trident")){jQuery.browser.msie=!0;jQuery.browser.name="Microsoft Internet Explorer";var start=nAgt.indexOf("rv:")+3,end=start+4;jQuery.browser.fullVersion=nAgt.substring(start,end)}else-1!=(verOffset=nAgt.indexOf("Edge"))?(jQuery.browser.edge=!0,jQuery.browser.name="Microsoft Edge",jQuery.browser.fullVersion=nAgt.substring(verOffset+5)):-1!=(verOffset=nAgt.indexOf("Chrome"))?(jQuery.browser.webkit=!0,jQuery.browser.chrome=
	!0,jQuery.browser.name="Chrome",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):-1<nAgt.indexOf("mozilla/5.0")&&-1<nAgt.indexOf("android ")&&-1<nAgt.indexOf("applewebkit")&&!(-1<nAgt.indexOf("chrome"))?(verOffset=nAgt.indexOf("Chrome"),jQuery.browser.webkit=!0,jQuery.browser.androidStock=!0,jQuery.browser.name="androidStock",jQuery.browser.fullVersion=nAgt.substring(verOffset+7)):-1!=(verOffset=nAgt.indexOf("Safari"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name=
	"Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("AppleWebkit"))?(jQuery.browser.webkit=!0,jQuery.browser.safari=!0,jQuery.browser.name="Safari",jQuery.browser.fullVersion=nAgt.substring(verOffset+7),-1!=(verOffset=nAgt.indexOf("Version"))&&(jQuery.browser.fullVersion=nAgt.substring(verOffset+8))):-1!=(verOffset=nAgt.indexOf("Firefox"))?(jQuery.browser.mozilla=
	!0,jQuery.browser.name="Firefox",jQuery.browser.fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(jQuery.browser.name=nAgt.substring(nameOffset,verOffset),jQuery.browser.fullVersion=nAgt.substring(verOffset+1),jQuery.browser.name.toLowerCase()==jQuery.browser.name.toUpperCase()&&(jQuery.browser.name=navigator.appName));
-1!=(ix=jQuery.browser.fullVersion.indexOf(";"))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix));-1!=(ix=jQuery.browser.fullVersion.indexOf(" "))&&(jQuery.browser.fullVersion=jQuery.browser.fullVersion.substring(0,ix));jQuery.browser.majorVersion=parseInt(""+jQuery.browser.fullVersion,10);isNaN(jQuery.browser.majorVersion)&&(jQuery.browser.fullVersion=""+parseFloat(navigator.appVersion),jQuery.browser.majorVersion=parseInt(navigator.appVersion,10));
jQuery.browser.version=jQuery.browser.majorVersion;jQuery.browser.android=/Android/i.test(nAgt);jQuery.browser.blackberry=/BlackBerry|BB|PlayBook/i.test(nAgt);jQuery.browser.ios=/iPhone|iPad|iPod|webOS/i.test(nAgt);jQuery.browser.operaMobile=/Opera Mini/i.test(nAgt);jQuery.browser.windowsMobile=/IEMobile|Windows Phone/i.test(nAgt);jQuery.browser.kindle=/Kindle|Silk/i.test(nAgt);
jQuery.browser.mobile=jQuery.browser.android||jQuery.browser.blackberry||jQuery.browser.ios||jQuery.browser.windowsMobile||jQuery.browser.operaMobile||jQuery.browser.kindle;jQuery.isMobile=jQuery.browser.mobile;jQuery.isTablet=jQuery.browser.mobile&&765<jQuery(window).width();jQuery.isAndroidDefault=jQuery.browser.android&&!/chrome/i.test(nAgt);jQuery.mbBrowser=jQuery.browser;
jQuery.browser.versionCompare=function(a,e){if("stringstring"!=typeof a+typeof e)return!1;for(var c=a.split("."),d=e.split("."),b=0,f=Math.max(c.length,d.length);b<f;b++){if(c[b]&&!d[b]&&0<parseInt(c[b])||parseInt(c[b])>parseInt(d[b]))return 1;if(d[b]&&!c[b]&&0<parseInt(d[b])||parseInt(c[b])<parseInt(d[b]))return-1}return 0};
;/*___________________________________________________________________________________________________________________________________________________
 _ jquery.mb.components                                                                                                                             _
 _                                                                                                                                                  _
 _ file: jquery.mb.simpleSlider.min.js                                                                                                              _
 _ last modified: 09/05/17 19.31                                                                                                                    _
 _                                                                                                                                                  _
 _ Open Lab s.r.l., Florence - Italy                                                                                                                _
 _                                                                                                                                                  _
 _ email: matteo@open-lab.com                                                                                                                       _
 _ site: http://pupunzi.com                                                                                                                         _
 _       http://open-lab.com                                                                                                                        _
 _ blog: http://pupunzi.open-lab.com                                                                                                                _
 _ Q&A:  http://jquery.pupunzi.com                                                                                                                  _
 _                                                                                                                                                  _
 _ Licences: MIT, GPL                                                                                                                               _
 _    http://www.opensource.org/licenses/mit-license.php                                                                                            _
 _    http://www.gnu.org/licenses/gpl.html                                                                                                          _
 _                                                                                                                                                  _
 _ Copyright (c) 2001-2017. Matteo Bicocchi (Pupunzi);                                                                                              _
 ___________________________________________________________________________________________________________________________________________________*/
(function(b){b.simpleSlider={defaults:{initialval:0,maxVal:100,orientation:"h",readonly:!1,callback:!1},events:{start:b.browser.mobile?"touchstart":"mousedown",end:b.browser.mobile?"touchend":"mouseup",move:b.browser.mobile?"touchmove":"mousemove"},init:function(d){return this.each(function(){var a=this,c=b(a);c.addClass("simpleSlider");a.opt={};b.extend(a.opt,b.simpleSlider.defaults,d);b.extend(a.opt,c.data());var f="h"==a.opt.orientation?"horizontal":"vertical";f=b("<div/>").addClass("level").addClass(f);
		c.prepend(f);a.level=f;c.css({cursor:"default"});"auto"==a.opt.maxVal&&(a.opt.maxVal=b(a).outerWidth());c.updateSliderVal();a.opt.readonly||(c.on(b.simpleSlider.events.start,function(e){b.browser.mobile&&(e=e.changedTouches[0]);a.canSlide=!0;c.updateSliderVal(e);"h"==a.opt.orientation?c.css({cursor:"col-resize"}):c.css({cursor:"row-resize"});a.lastVal=a.val;b.browser.mobile||(e.preventDefault(),e.stopPropagation())}),b(document).on(b.simpleSlider.events.move,function(e){b.browser.mobile&&(e=e.changedTouches[0]);
			a.canSlide&&(b(document).css({cursor:"default"}),c.updateSliderVal(e),b.browser.mobile||(e.preventDefault(),e.stopPropagation()))}).on(b.simpleSlider.events.end,function(){b(document).css({cursor:"auto"});a.canSlide=!1;c.css({cursor:"auto"})}))})},updateSliderVal:function(d){var a=this.get(0);if(a.opt){a.opt.initialval="number"==typeof a.opt.initialval?a.opt.initialval:a.opt.initialval(a);var c=b(a).outerWidth(),f=b(a).outerHeight();a.x="object"==typeof d?d.clientX+document.body.scrollLeft-this.offset().left:
			"number"==typeof d?d*c/a.opt.maxVal:a.opt.initialval*c/a.opt.maxVal;a.y="object"==typeof d?d.clientY+document.body.scrollTop-this.offset().top:"number"==typeof d?(a.opt.maxVal-a.opt.initialval-d)*f/a.opt.maxVal:a.opt.initialval*f/a.opt.maxVal;a.y=this.outerHeight()-a.y;a.scaleX=a.x*a.opt.maxVal/c;a.scaleY=a.y*a.opt.maxVal/f;a.outOfRangeX=a.scaleX>a.opt.maxVal?a.scaleX-a.opt.maxVal:0>a.scaleX?a.scaleX:0;a.outOfRangeY=a.scaleY>a.opt.maxVal?a.scaleY-a.opt.maxVal:0>a.scaleY?a.scaleY:0;a.outOfRange="h"==
	a.opt.orientation?a.outOfRangeX:a.outOfRangeY;a.value="undefined"!=typeof d?"h"==a.opt.orientation?a.x>=this.outerWidth()?a.opt.maxVal:0>=a.x?0:a.scaleX:a.y>=this.outerHeight()?a.opt.maxVal:0>=a.y?0:a.scaleY:"h"==a.opt.orientation?a.scaleX:a.scaleY;"h"==a.opt.orientation?a.level.width(Math.floor(100*a.x/c)+"%"):a.level.height(Math.floor(100*a.y/f));a.lastVal===a.value&&("h"===a.opt.orientation&&(a.x>=this.outerWidth()||0>=a.x)||"h"!==a.opt.orientation&&(a.y>=this.outerHeight()||0>=a.y))||(console.debug(a.value),
	"function"===typeof a.opt.callback&&a.opt.callback(a),a.lastVal=a.value)}}};b.fn.simpleSlider=b.simpleSlider.init;b.fn.updateSliderVal=b.simpleSlider.updateSliderVal})(jQuery);
