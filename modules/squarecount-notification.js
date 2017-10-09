const Canvas = require('canvas-prebuilt');
Image = Canvas.Image;

const https = require('https');
const fs = require('fs');

const defaultLayout = {
	from: {
		round: {
			x: 85,
			y: 15,
			width: 130
		}, contour: {
			width: 4,
			style: "#fff"
		}
	}, to1to1: {
		round: {
			x: 415,
			y: 190,
			width: 130
		}, contour: {
			width: 4,
			style: "#fff"			
		}, intro: {
			text: "pour",
			x: 318,
			y: 228,
			align: "left",
			style: "rgba(255, 255, 255, 0.8)",		
			font: {
				weight: '400',
				size: 40,
				family: 'Titillium Web'
			}		
		}
	}, toGroup: {
		width: 95,
		spacing: 35,
		y: 226,
		contour: {
			width: 4,
			style: "rgba(255, 255, 255, 0.8)"
		}, linkLine: {
			height: 4,
			style: "#fff"
		}, intro: {
			text: length => `pour ${length} personnes`,
			x: 320,
			y: 172,
			align: "center",
			style: "rgba(255, 255, 255, 0.8)",		
			font: {
				weight: '400',
				size: 40,
				family: 'Titillium Web'
			}
		}, plus: {
			x: 513,
			y: 227,
			align: "center",
			style: "#fff",
			font: {
				weight: '600',
				size: 66,
				family: 'Titillium Web'
			}		
		}
	}, price: {
		withReason: {
			x: 234,
			y: 60,
			align: "left",
			style: "#fff",
			font: {
				weight: '600',
				size: 82,
				family: 'Titillium Web'
			}			
		}, withoutReason: {
			x: 234,
			y: 29,
			align: "left",
			style: "#fff",
			font: {
				weight: '600',
				size: 82,
				family: 'Titillium Web'
			}			
		}

	}, reason: {
		x: 234,
		y: 9,
		align: "left",
		style: "rgba(255, 255, 255, 0.8)",
		font: {
			weight: '400',
			size: 38,
			family: 'Titillium Web'
		}		
	}, cancelled: {
		url: "public/images/cancel.png",
		aspectRatio: 0.25,
		opacity: 0.6
	}
}

exports.createNotification = (canvas, transaction, layout) => {

	return new Promise((resolve, reject) => {

		try {

			let ctx = canvas.getContext("2d");
			if (!layout) {
				layout = defaultLayout;
			}

			let cancelImage;
			let users;

			initializeUserImages(transaction)
				.then(u => {
					users = u;
				})
				.then(() => initializeImage(layout.cancelled.url))
				.then(i => {
					cancelImage = i;
				})
				.then(() => {

					drawBackground(canvas);


					let fromUser = users[transaction.from.id];

					drawFrom(canvas, layout.from, fromUser);

					if (transaction.to.length == 1) {
						let toUser = users[transaction.to[0].user.id];
						drawTo1to1(canvas, layout.to1to1, toUser);
					} else {
						let toUsers = [];
						transaction.to.forEach(t => {
							toUsers.push(users[t.user.id]);
						});
						drawToGroup(canvas, layout.toGroup, toUsers);		
					}


					let maxReasonTextWidth = getTextWidth(canvas, layout.price.withReason, "999,99 €");
					let priceTextWidth;
					let priceLayout = layout.price.withoutReason;
					if (transaction.reason) {
						drawMultiLineText(canvas, layout.reason, transaction.reason, maxReasonTextWidth, 32);
						priceLayout = layout.price.withReason;
					}
					let priceText = transaction.amount + " €";
					priceTextWidth = drawText(canvas, priceLayout, priceText);				
					
					if (priceTextWidth && transaction.status !== "active") {
						let width = cancelImage.width * layout.cancelled.aspectRatio;
						let height = cancelImage.height * layout.cancelled.aspectRatio;
						let p = {
							opacity: layout.cancelled.opacity,
							x: priceLayout.x + priceTextWidth / 2 - width / 2,
							y: priceLayout.y + priceLayout.font.size / 2 + 12 - height / 2,
							width: width,
							height: height
						}
						drawCancelImage(canvas, p, cancelImage);
					}
					resolve();
				})
		} catch(e) {
			console.log(e);
			reject(e);
		}
	});


};

const initializeUserImages = transaction => {
	return new Promise((resolve, reject) => {

		let promises = [];
		let users = {};

		let owner = transaction.owner;
		users[owner.id] = {
			id: owner.id,
			imageUrl: owner["profile_pic"]
		}

		let from = transaction.from;
		users[from.id] = {
			id: from.id,
			imageUrl: from["profile_pic"]
		}

		transaction.to.forEach(to => {
			users[to.user.id] = {
				id: to.user.id,
				imageUrl: to.user["profile_pic"]
			}
		});


		Object.keys(users).forEach(id => {
			let user = users[id];
			let imageUrl = user.imageUrl;

			promises.push(new Promise((resolve, reject) => {

				https.get(imageUrl, res => {
				    var buf = '';
				    res.setEncoding('binary');
				    res.on('data', chunk => { buf += chunk; });
				    res.on('end', () => {
				        var image = new Image;
				        image.onload = () => {
//							console.log("Image " + imageUrl + " is loaded");
							user.image = image;
							resolve();
				        };
				        image.onerror = function(err){
				            console.log(err);
				            reject(err);
				        };
				        image.src = new Buffer(buf, 'binary');
				    });
				});
			}));
		});
		Promise.all(promises).then(() => resolve(users));
	});
}

const initializeImage = (path) => {
	return new Promise((resolve, reject) => {

		fs.readFile(__dirname + "/../" + path, function(err, content){
		  	if (err) throw err;
		  	let image = new Image;
		  	image.src = content;
		  	resolve(image);
		});
	});
}

const getCanvasWidth = canvas => {
	return canvas.clientWidth ? canvas.clientWidth : canvas.width;
}

const getCanvasHeight = canvas => {
	return canvas.clientHeight ? canvas.clientHeight : canvas.height;
}

const drawBackground = canvas => {

	let ctx = canvas.getContext("2d");
	let canvasWidth = getCanvasWidth(canvas);
	let canvasHeight = getCanvasHeight(canvas);

/*	let gradient = ctx.createLinearGradient(0.000, canvasHeight / 2, canvasWidth, canvasHeight / 2);
      
    // Add colors
    gradient.addColorStop(0.000, 'rgba(22, 187, 205, 1.000)');
    gradient.addColorStop(1.000, 'rgba(0, 255, 191, 1.000)');	*/

    ctx.fillStyle = /*gradient;*/"#16C5BF"
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);	
}

const drawFrom = (canvas, p, fromUser) => {
	drawRoundedImage(canvas, p.round, p.contour, fromUser.image);

}

const drawTo1to1 = (canvas, p, toUser) => {
	drawText(canvas, p.intro, p.intro.text);
	drawRoundedImage(canvas, p.round, p.contour, toUser.image);
}

const drawToGroup = (canvas, p, toUsers) => {

	let ctx = canvas.getContext("2d");
	let canvasWidth = getCanvasWidth(canvas);
	let canvasHeight = getCanvasHeight(canvas);


	drawText(canvas, p.intro, p.intro.text(toUsers.length));

	let toUserLengthOrMax = toUsers.length;
	if (toUsers.length > 4) {
		toUserLengthOrMax = 4;
	}

	let toPanelWidth = p.width * toUserLengthOrMax + p.spacing * (toUserLengthOrMax - 1);

	let toPanelLineWidth = p.width * (toUserLengthOrMax - 2) + p.spacing * (toUserLengthOrMax - 1);
	let toPanelLineX = canvasWidth / 2 - toPanelWidth / 2 + p.width;

	ctx.fillStyle = p.linkLine.style;
	ctx.fillRect(toPanelLineX, p.y + p.width / 2 - p.linkLine.height / 2, toPanelLineWidth, p.linkLine.height);

	let round;

	toUsers.forEach((toUser, index) => {
		if (index < 4) {
			round = {
				x: canvasWidth / 2 + index * (p.width + p.spacing) - toPanelWidth / 2,
				y: p.y,
				width: p.width
			};			
		}
		if (index < 3 || (index == 3 && toUsers.length == 4)) {
			drawRoundedImage(canvas, round, p.contour, toUser.image);
		} else if (index == 3 && toUsers.length > 4) {

			let plusText = "+" + (toUsers.length - 3);

			drawRoundedText(canvas, round, p.contour, p.plus, plusText);
		}

	});	
}

const drawRoundedImage = (canvas, round, contour, image) => {

	let ctx = canvas.getContext("2d");

	ctx.save();

	ctx.beginPath();
	ctx.arc(round.x + round.width / 2, round.y + round.width / 2, round.width / 2, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	ctx.drawImage(image, round.x, round.y, round.width, round.width);	

	ctx.restore();
//	ctx.restore();


        
    /// change composite mode to use that shape
//    ctx.globalCompositeOperation = 'source-in';
    
//	ctx.drawImage(image, round.x, round.y, round.width, round.width);
//  ctx.globalCompositeOperation = 'source-over';	

	drawContour(canvas, round, contour);
}

const drawRoundedText = (canvas, round, contour, plus, text) => {
	let ctx = canvas.getContext("2d");

//	ctx.drawImage(image, round.x, round.y, round.width, round.width);
	ctx.fillStyle = "rgba(19, 130, 126, 1)";
	ctx.lineWidth = 0;	
	ctx.beginPath();
	ctx.arc(round.x + round.width / 2, round.y + round.width / 2, round.width / 2, 0, Math.PI * 2, true);
	ctx.fill();
	drawText(canvas, plus, text);

	drawContour(canvas, round, contour);	
}

const drawContour = (canvas, round, contour) => {
	let ctx = canvas.getContext("2d");
	ctx.strokeStyle = contour.style;
	ctx.lineWidth = contour.width;	
	ctx.beginPath();
	ctx.arc(round.x + round.width / 2, round.y + round.width / 2, round.width / 2 - 1, 0, Math.PI * 2, true);		
	ctx.stroke();	

}

const drawCancelImage = (canvas, p, image) => {
	let ctx = canvas.getContext("2d");
	ctx.globalAlpha = p.opacity;
	ctx.drawImage(image, p.x, p.y, p.width, p.height);
	ctx.globalAlpha = 1;	

}


const getTextWidth = (canvas, p, text) => {

	let ctx = canvas.getContext("2d");

	ctx.font = `normal ${p.font.weight} ${p.font.size}px ${p.font.family}`;
	ctx.textAlign = p.align;
	ctx.fillStyle = p.style;
	return ctx.measureText(text).width;
}

const drawText = (canvas, p, text) => {

	let ctx = canvas.getContext("2d");

	ctx.font = `normal ${p.font.weight} ${p.font.size}px ${p.font.family}`;
	ctx.textAlign = p.align;
	ctx.fillStyle = p.style;
	ctx.fillText(text, p.x, p.y + p.font.size);
	return ctx.measureText(text).width;	
}

const drawMultiLineText = (canvas, p, text, maxLineWidth, lineHeight) => {

	let ctx = canvas.getContext("2d");

	ctx.font = `normal ${p.font.weight} ${p.font.size}px ${p.font.family}`;
	ctx.textAlign = p.align;
	ctx.fillStyle = p.style;

	let y = p.y;

	if (ctx.measureText(text).width <= maxLineWidth) {
		y += lineHeight;
		ctx.fillText(text, p.x, y + p.font.size);		

	} else {
		let words = text.split(/\s+/);
		let line = '';

	    for (let i = 0; i < words.length; i++) {
	    	let testLine = line + words[i] + ' ';
	      	let testWidth = ctx.measureText(testLine).width;
	      	if (testWidth > maxLineWidth && i > 0) {
				ctx.fillText(line, p.x, y + p.font.size);
	        	line = words[i] + ' ';
	        	y += lineHeight;
	      	}
	      	else {
	        	line = testLine;
		    }
	    }		
		ctx.fillText(line, p.x, y + p.font.size);	    
	}

}

