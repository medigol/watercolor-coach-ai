// API simulation only. Never requests a real video or represents live playback.
module.exports = `
window.YT_TEST={instances:[],calls:[],emit(code,time){const p=this.instances.at(-1);p.state=code;if(time!==undefined)p.time=time;p.events.onStateChange({data:code});},error(code){this.instances.at(-1).events.onError({data:code});}};
window.YT={Player:class {
 constructor(node,config){this.node=node;this.events=config.events;this.time=0;this.state=5;this.dead=false;window.YT_TEST.instances.push(this);queueMicrotask(()=>this.events.onReady());}
 cueVideoById(c){this.time=c.startSeconds;this.state=5;window.YT_TEST.calls.push(['cue',c]);this.events.onStateChange({data:5});}
 loadVideoById(c){this.time=c.startSeconds;window.YT_TEST.calls.push(['load',c]);}
 playVideo(){window.YT_TEST.calls.push(['play']);}
 pauseVideo(){if(!this.dead){this.state=2;window.YT_TEST.calls.push(['pause']);this.events.onStateChange({data:2});}}
 getCurrentTime(){return this.time;} getPlayerState(){return this.state;} getIframe(){return this.node;}
 destroy(){if(!this.dead){this.dead=true;window.YT_TEST.calls.push(['destroy']);this.node.remove();}}
}};
window.onYouTubeIframeAPIReady?.();`;
