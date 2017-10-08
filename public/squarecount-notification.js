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
		url: "images/cancel.png",
		aspectRatio: 0.7,
		opacity: 0.7
	}
}


const createNotification = (canvas, users, data, layout) => {

	let ctx = canvas.getContext("2d");
	if (!layout) {
		layout = defaultLayout;
	}

	initializeUserImages(users)
		.then(() => initializeCancelImage(layout.cancelled.url))
		.then(cancelImage => {


			drawBackground(canvas);

			let fromUser = users[data.from.id];

			drawFrom(canvas, layout.from, fromUser);

			if (data.to.length == 1) {
				let toUser = users[data.to[0].id];
				drawTo1to1(canvas, layout.to1to1, toUser);
			} else {
				let toUsers = [];
				data.to.forEach(t => {
					toUsers.push(users[t.id]);
				});
				drawToGroup(canvas, layout.toGroup, toUsers);		
			}


			let maxReasonTextWidth = getTextWidth(canvas, layout.price.withReason, "999,99 €");
			let priceTextWidth;
			let priceLayout = layout.price.withoutReason;
			if (data.reasonText) {
				drawMultiLineText(canvas, layout.reason, data.reasonText, maxReasonTextWidth, 32);
				priceLayout = layout.price.withReason;
			}
			priceTextWidth = drawText(canvas, priceLayout, data.priceText);				
			
			if (priceTextWidth && data.cancelled) {
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


		})
};

const initializeUserImages = users => {
	return new Promise((resolve, reject) => {

		let promises = [];

		Object.keys(users).forEach(id => {
			let user = users[id];
			let imageUrl = user.imageUrl;

			promises.push(new Promise((resolve, reject) => {
				let image = new Image();
				image.src = imageUrl;
				image.onload = () => {
					user.image = image;
					resolve();
				}	
			}));
		});
		Promise.all(promises).then(resolve);
	});
}

const initializeCancelImage = (url) => {
	return new Promise((resolve, reject) => {
		let image = new Image();
		image.src = url;
		image.onload = () => resolve(image);
	});
}

const drawBackground = canvas => {

	let ctx = canvas.getContext("2d");
	let canvasWidth = canvas.clientWidth;
	let canvasHeight = canvas.clientHeight;

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
	let canvasWidth = canvas.clientWidth;
	let canvasHeight = canvas.clientHeight;


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

	ctx.drawImage(image, round.x, round.y, round.width, round.width);
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

