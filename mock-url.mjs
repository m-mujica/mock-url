import { Component, DefineMap, stache } from "//unpkg.com/can@pre/core.mjs";

var style = document.createElement("style");
style.innerHTML = `
mock-url {display: block; background-color: #efefef;}
mock-url .location {
	display: flex;
	margin-bottom: 20px;
	font-size: 20px;
}
mock-url .url {
	font-family: system-ui;
	display: flex;
	border: solid 1px;
	padding: 2px 2px 2px 5px;
	flex-grow: 1;
	flex-direction: row;
}
mock-url .url .base {
	flex-grow: 0;
	flex-shrink: 0;
	line-height: 24px;
	padding: 1px 0px;
  position: relative;
}
mock-url .input {
	flex-grow: 1;
}
mock-url .back, mock-url .forward {
	font-size: 20px;
	font-family: Verdana,sans-serif;
	border: solid 1px black;
	padding: 5px;
	line-height: 20px;
	flex-grow: 0;
	cursor: pointer;
}
mock-url .back:hover, mock-url .forward:hover, mock-url input:hover {
	background-color: #ADD8E6;
}
mock-url input {
	border: none;
	font-size: 20px;
	background-color: #efefef;
	width: 100%;
}
mock-url .url .base {
	width: inherit;
}
`;

document.body.appendChild(style);

Component.extend({
	tag: "mock-url",
	view: `
		<div class='location'>
			<span class='back' on:click='back()'>&#x21E6;</span>
			<span class='forward' on:click='forward()'>&#x21E8;</span>
			<div class="url">
				<span class='base'>{{page}}</span>
				<span class='input'>
				{{# if (pushstate) }}
					<input value:bind="path"/>
				{{ else }}
					<input value:bind="url" placeholder="#! The hash is empty"/>
				{{/ if }}
				</span>
			</div>
		</div>
	`,
	ViewModel: DefineMap.extend("MockUrl", {
		page: {
			default() {
				if (this.pushstate) {
					return "https://foo.com";
				}
				return "/my-app.html";
			}
		},
		pushstate: {
			default: false,
			type: "boolean"
		},
		path: {
			value(prop) {
				// if pushstate's value isn't changed exit function
				if (!this.pushstate) {
					prop.resolve(null);
					return;
				}

				var pushState = window.history.pushState;
				var replaceState = window.history.replaceState;

				// listen to pushState
				window.history.pushState = function(){
					pushState.apply(this, arguments);
					prop.resolve(location.pathname + window.location.hash);
				};
				
				// listen to replaceState
				window.history.replaceState = function(){
					replaceState.apply(this, arguments);
					prop.resolve(location.pathname + window.location.hash);
				};
        
				// handle input
				prop.listenTo(prop.lastSet, function(newVal) {
					window.history.pushState( null, null, newVal );
				});
				
				// creating default pathname
				window.history.replaceState( null, null, '/' );
				
				
				// listen to history.back() and history.forward()
				function popStateHandler() {
					setTimeout(function() {
						prop.resolve(location.pathname + window.location.hash);
					}, 100);
				}
				window.addEventListener("popstate", popStateHandler);
				
				// teardown
				return function() {
					// reset pushState and replaceState
					window.history.pushState = pushState;
					window.history.replaceState = replaceState;
					// clear remove popStateHandler listener
					window.removeEventListener("popstate", popStateHandler);
				};
			}
		},
		url: {
			value(prop) {
				// When the property is set, update the hash.
				prop.listenTo(prop.lastSet, function(newVal){
					window.location.hash = newVal;
				});

				// When the hash changes, update the property
				function updateWithHash(){
					prop.resolve(window.location.hash);
				}
				window.addEventListener("hashchange", updateWithHash);

				// Set the property value right away
				prop.resolve(window.location.hash);

				// teardown
				return function() {
					window.removeEventListener("hashchange", updateWithHash);
				};
			}
		},
		back() {
			history.back();
		},
		forward() {
			history.forward();
		}
	})
});
