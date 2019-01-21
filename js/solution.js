'use strict';

//перемещение блока меню
class DragMenu {
	constructor() {
		this.movedMenu = null;
		this.shiftX = 0;
		this.shiftY = 0;
		this.menu = document.querySelector('.menu');

		this.initEvents();		
	}

	initEvents() {
		document.addEventListener('mousedown', this.dragOn.bind(this));
		document.addEventListener('mousemove', this.dragMove.bind(this));
		document.addEventListener('mouseup', this.dragOff.bind(this));
		document.addEventListener('DOMContendLoaded', this.checkPosition());
	}

	dragOn(event) {
		event.preventDefault();
		if (event.target.classList.contains('drag')) {		
			const bounds = event.target.getBoundingClientRect();
			this.shiftX = event.pageX - bounds.left - window.pageXOffset;
			this.shiftY = event.pageY - bounds.top - window.pageYOffset;
			localStorage.shiftX = this.shiftX;
			localStorage.shiftY	= this.shiftY;	
			this.movedMenu = event.target.parentElement;		
		}
	}

	dragMove(event) {
		if (this.movedMenu) {
			event.preventDefault();
			let x = event.pageX - this.shiftX;
			let y = event.pageY - this.shiftY;
			this.changePosition(x, y);
		}
	}

	changePosition(x, y) {
		let body = document.querySelector('body');

		let menu = this.movedMenu ? this.movedMenu : this.menu;

		//вычисление точной ширины блока меню через его детей
		let compytedWidthMenu = Array.from(menu.children).reduce((sum, item) => {			
			if (getComputedStyle(item).width !== 'auto' && item.style.display !== 'none') {
				console.log(+getComputedStyle(item).width.slice(0, -2))
				return sum + +getComputedStyle(item).width.slice(0, -2);
			} else {
				return sum;
			}		
		}, 0);
		//добавляем бордер для объекта меню
		compytedWidthMenu += 2 * getComputedStyle(menu).borderRightWidth.slice(0, -2);

		//ограничение позиции меню
		x = Math.max(x, body.offsetLeft);
		y = Math.max(y, body.offsetTop);
		x = Math.min(x, document.documentElement.clientWidth - compytedWidthMenu);
		y = Math.min(y, document.documentElement.clientHeight);

		menu.style.setProperty('--menu-left', x + 'px');
		menu.style.setProperty('--menu-top', y + 'px');
		this.setPosition(x, y);
	}

	dragOff(event) {
		if (this.movedMenu) {
			event.preventDefault();
			this.movedMenu.style.visibility = 'hidden';
			let cart = document.elementFromPoint(event.clientX, event.clientY);		
			if (cart.id === 'trash_bin') {
				this.movedMenu.style.display = 'none';
			}	
			this.movedMenu.style.visibility = 'visible';
			this.movedMenu.classList.remove('moving');
			this.movedMenu = null;
		}	
	}

	//сохранение позиции меню
	setPosition(x, y) {
		localStorage.position = JSON.stringify({x, y});
	}

	checkPosition() {
		let position = JSON.parse(localStorage.position);
		if (position) {
			this.menu.style.setProperty('--menu-left', position.x + 'px');
			this.menu.style.setProperty('--menu-top', position.y + 'px');			
		}
	}
}

class SwitchMenu {
	constructor() {
		this.menu = document.querySelector('.menu');
		this.burger = this.menu.querySelector('.burger');
		this.currentImage = document.querySelector('.current-image');
		this.container = document.querySelector('.wrap.app');
		this.error = document.querySelector('.error');
		this.loader = document.querySelector('.image-loader');		
		
		this.initEvents();		
	}

	initEvents() {
		this.burger.addEventListener('click', this.reviewing.bind(this));

		Array
		  .from(this.menu.querySelectorAll('.mode'))
		  .forEach((node) => {
		  	node.addEventListener('click', this.toggleMenu.bind(this));
		  });

		this.container.addEventListener('drop', this.uploadImage.bind(this));
		this.container.addEventListener('dragover', event => {event.preventDefault()});
		document.addEventListener('DOMContendLoaded', this.checkReviewing());
	}

	toggleMenu(event) {

		//console.log('переключение');

		let switcher = ['new', 'comments', 'draw', 'share'];
		let currentClassList = event.currentTarget.classList;
		
		if (currentClassList.contains('new') && currentClassList.contains('active')) {
			//загрузка фото по клику "Загрузить новое"
			let inputFile = document.createElement('input');
			inputFile.setAttribute('type', 'file');			
			inputFile.addEventListener('input', this.uploadImage.bind(this));
			inputFile.click();
		} else {

			switcher.forEach(cls => {
				if (currentClassList.contains(cls) 
					&& !currentClassList.contains('active')) {

					//включаем публикацию
					if (cls === 'new') {
						return this.publication();
					}
					
					//убираем другие пункты отличные от выбранного
					Array
					  .from(this.menu.querySelectorAll('.mode'))
					  .forEach((node) => {
					  	node.style.display = 'none';
					  });
					
					this.menu.getElementsByClassName(cls)[0].style.display = 'inline-block';
					if (this.menu.querySelector('.' + cls + '-tools')) {
						this.menu.querySelector('.' + cls + '-tools').style.display = 'inline-block';
					}
					
					this.menu.getElementsByClassName(cls)[0].classList.add('active');

					if (!currentClassList.contains('new')) {
						this.burger.style.display = 'inline-block';
					}

					//уточнение позиции при переключении
					let position = JSON.parse(localStorage.position);
					dragger.changePosition(position.x, position.y);
				}
			});
		}
	}

	publication() {
		//стартовое меню для тестов
		//this.burger.style.display = 'none';

		//console.log('публикация')

		//убираем вывод ошибок
		this.error.style.display = 'none';
		//вывод меню публикации (загрузить фото)
		Array
			.from(this.menu.querySelectorAll('.mode, .burger'))
			.forEach((node) => {
				if (!node.classList.contains('new')) {
					node.style.display = 'none';
				} else {
					node.classList.add('active');
				}
			});
		
		this.currentImage.setAttribute('src', '');
		localStorage.reviewing = '';
	}

	reviewing() {

		//console.log('рецензирование');

		this.burger.style.display = 'none';		

		Array
			.from(this.menu.querySelectorAll('.mode'))
			.forEach((node) => {
				node.style.display = 'inline-block';
				node.classList.remove('active');
			});

		Array
			.from(this.menu.querySelectorAll('.tool'))
			.forEach((node) => {
				node.style.display = 'none';
			});
	}

	uploadImage(event) {
		event.preventDefault();		
		let image;
		const error = this.error.querySelector('.error__message');
		let accept = ['image/png', 'image/jpeg'];
		//проверяем откуда пришел файл
		if (event.type == 'input') {
			image = Array.from(event.target.files)[0];		
		} else if (event.type == 'drop') {
			image = event.dataTransfer.files[0];

			if (!this.menu.querySelector('.new.active')) {
				//вывод ошибки при вбросе фото в режиме рецензирования
				error.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом «Загрузить новое» в меню';				
				this.error.style.display = 'block';
				return;
			}
		}
		//проверяем тип файла
		if (accept.includes(image.type)) {
			this.error.style.display = 'none';
			const sourse = URL.createObjectURL(image);

			this.setReviewing(sourse);
			fetch(sourse)
			  .then(response => response.blob())
			  .then(blob => new Promise((resolve, reject) => {
			    const reader = new FileReader()
			    reader.addEventListener('loadend', () => resolve(reader.result));
			    reader.addEventListener('error', reject);
			    reader.readAsDataURL(blob)
			  }))
			  .then(dataUrl => {
			  	//отправляем изображение на сервер
			    this.sendImage(dataUrl);
			  })
			  
			this.currentImage.addEventListener('load', (event) => {				
				URL.revokeObjectURL(event.target.src);
			});					
		} else {
			//вывод ошибоки при неверном типе файла		
			error = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом «Загрузить новое» в меню';
			this.error.style.display = 'block';
		}	
	}

	//отправка изображения на сервер
	sendImage(dataUrl) {
		//вывод прелоадера
		this.loader.style.display = 'block';
		//console.log(dataUrl);
		let timerId = setInterval(() => {
			this.loader.style.display = 'none';
			localStorage.reviewing = dataUrl;
			this.currentImage.src = dataUrl;
			this.reviewing();
			//чистим таймаут
			clearTimeout(timerId);
		}, 2000);

		//пробная отправка на сервер
		fetch('https://neto-api.herokuapp.com', {
			body: dataUrl,
			credentials: 'same-origin',
			method: 'POST',
			headers: { 'Content-Type': 'multipart/form-data' }
		})
			.then((res) => {
				console.log(res);
				if (200 <= res.status && res.status < 300) {
					return res;
				}
				throw new Error(res.statusText);
			})
			.then((res) => console.log(res))
			.then((data) => {
				if (data.error) {
					throw new Error(data.message);
				}
				console.log(data);
			})
			.catch((error) => {
				console.log(error, error.message);
			})
	}

	//сохранение фото для рецензирования
	setReviewing(src) {
		//получение ссылки на изображение в формате base64
		localStorage.reviewing = src;
	}

	checkReviewing() {
		//console.log(localStorage.reviewing);

		//включение сохраненного режима
		if (!localStorage.reviewing) {
			return this.publication();
		} else {
			this.reviewing();
		}

		//вывод сохраненного изображения
		let reviewing = localStorage.reviewing;
		if (reviewing) {
			this.currentImage.src = reviewing;
		}
	}
}

const dragger = new DragMenu;
document.addEventListener('DOMContendLoaded', dragger);
document.addEventListener('DOMContendLoaded', new SwitchMenu);

/*let res = Array.from(document.querySelector('.menu').children).map(item => {	
	return parseFloat(getComputedStyle(item).width.slice(0, -2));
});
console.log(res)
res = res.reduce((sum, item) => {
	if (item) {
		return sum + item;
	} else return sum;
}, 0);
console.log(res)*/

