'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = Date.now() + '';
  // prettier-ignore
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  clicks = 0;

  constructor(cords, distance, duration) {
    this.cords = cords;
    this.distance = distance;
    this.duration = duration;
  }

  _isDescription() {
    this.des = `${this.type[0].toUpperCase()}${this.type.slice(1)}   0n  ${
      months[this.date.getMonth()]
    }  ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(cords, distance, duration, cadence) {
    super(cords, distance, duration);
    this.cadence = cadence;
    this.calcSpeed();
    this._isDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(cords, distance, duration, elevationGain) {
    super(cords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcPace();
    this._isDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workout;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    this.#workout = [];
    containerWorkouts.addEventListener('click', this._focuseOnMap.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('unable to fetch location');
        }
      );
  }

  _loadMap(pos) {
    const { latitude, longitude } = pos.coords;
    console.log(latitude, longitude);
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();

    this.#map.on('click', clickEvent => {
      this.#mapEvent = clickEvent;
      this._showForm();
    });
  }

  _showForm() {
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positiveNumbers = (...numbers) => numbers.every(num => num > 0);

    const { lat, lng } = this.#mapEvent.latlng;
    // get data from form
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;

    //Check if data is valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInputs(distance, duration, cadence)) {
        console.log(!validInputs(distance, duration, cadence));
        return alert('inputs has to be positive number');
      }
      if (!positiveNumbers(distance, duration, cadence)) {
        console.log(!positiveNumbers(distance, duration, cadence));
        return alert('inputs has to be positive number');
      }

      //if workout running create running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!validInputs(distance, duration, elevationGain))
        return alert('inputs has to be positive number');
      if (!positiveNumbers(distance, duration))
        return alert('inputs has to be positive number');

      //if workout cycling create cycling object
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    this.#workout.push(workout);
    //add new object to workout array

    //render workout on map as marker
    this._renderMarker(workout);

    //render workout on list
    this._renderList(workout);

    //hide form + clear input field
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _renderMarker(workout) {
    L.marker(workout.cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃 ' : '🚴 '} ${workout.des}`
      )
      .openPopup();
  }

  _renderList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title"> ${workout.des}</h2>
          <div class="workout__details">
            <span class="workout__icon"> ${
              workout.type === 'running' ? '🏃  ' : '🚴  '
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱  </span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️  </span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼  </span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️  </span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰  </span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _focuseOnMap(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(this.#workout);
    if (!workoutEl) return;
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.cords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    workout.click();
  }
}

const app = new App();
