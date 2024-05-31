const appWeather = async (id) => {
    const container = document.getElementById(id)

    const wrapper = document.createElement("div")
    wrapper.className = "appWeather"

    const loader = document.createElement("div")
    loader.className = "loader"
    //Подключение карты Яндекс
    const script = document.createElement('script');
    const apikey = "";
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apikey}&lang=ru_RU`;

    container.appendChild(script);
    container.appendChild(wrapper);
    container.appendChild(loader);

    //Для того, чтобы скрипт по загрузке карты отработал, требуется небольшая задержка,
    //чтобы подождать загрузку скрипта
    const promise = new Promise((res) => {
        setTimeout(() => {
            wrapper.innerHTML += `
                <div class="appWeatherBlock">
                    <div class="appWeatherCity"></div>
                    <div class="appWeatherTemperatureWrapper">
                        <div class="appWeatherTemperatureNow">Нажмите кнопку, чтобы получить данные</div>
                        <div class="appWeatherTemperatureWeek"></div>
                    </div>
                    <button class="appWeatherBtn">Обновить данные о погоде</button>
                    <div class="appWeatherForecast"></div>
                    <button class="appWeatherBtn appWeatherInfo">Как пользоваться?</button>
                    <div class="appWeatherModalWrapper hidden">
                        <div class="appWeatherModal hidden">
                            <span class="appWeatherModalInstruction">Для правильного использования приложения следует придерживаться следующей инструкции:</span>
                            <div class="appWeatherModalText">
                                <span>1. На карте справа выберите населенный пункт, где следует определить температуру</span>
                                <span>(Для этого передвиньте экран на нужное место, или воспользуйтесь поиском места на карте (значок лупы в верхнем левом углу карты))</span>
                                <span>2. Нажмите на кнопку "Сохранить" в левом верхнем углу карты</span>
                                <span>3. Нажмите кнопку "Обновить данные о погоде" в центре экрана</span>
                            </div>
                            <span class="appWeatherModalClose">ЧТОБЫ ЗАКРЫТЬ КЛИКНИТЕ В ЛЮБОМ МЕСТЕ</span>
                        </div>
                    </div>
                </div>
                <div id="map"></div>
            `
            const weatherBtn = document.querySelector(".appWeatherBtn")
            const cityDiv = document.querySelector(".appWeatherCity")
            const weatherToday = document.querySelector(".appWeatherTemperatureNow")
            const weatherForWeek = document.querySelector(".appWeatherTemperatureWeek")
            const appWeatherModalWrapper = document.querySelector(".appWeatherModalWrapper")
            const appWeatherModal = document.querySelector(".appWeatherModal")
            const appWeatherInfo = document.querySelector(".appWeatherInfo")

            appWeatherInfo.addEventListener('click', () => {
                appWeatherModal.className = "appWeatherModal"
                appWeatherModalWrapper.className = "appWeatherModalWrapper"
            })

            appWeatherModalWrapper.addEventListener('click', () => {
                appWeatherModal.className = "hidden"
                appWeatherModalWrapper.className = "hidden"
            })

            let coords = [55.73978875673482, 37.40814634625748]
            let city;

            let dates = [];
            let temperatureNow;
            let temperatureForWeekMax = [];
            let temperatureForWeekMin = [];

            for (let i = 0; i < 7; i++) {
                const date = document.createElement("div")
                date.className = `appWeatherTemperatureWeek${i}`
                weatherForWeek.appendChild(date)
            }

            const getWeekDay = (date) => {
                let days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

                return days[date.getDay()];
            }

            const initMap = () => {
                const map = new ymaps.Map("map", {
                    center: coords,
                    zoom: 16
                })

                const getCoords = () => {
                    coords = map.getCenter()
                    return coords
                }

                const getCityName = async () => {
                    const coords = getCoords()
                    const myReverseGeocoder = await ymaps.geocode(coords, {kind: "province"});
                    const result = await myReverseGeocoder.geoObjects.get(0).properties.get('name')
                    city = result
                    cityDiv.innerHTML = city
                }

                const weatherButton = new ymaps.control.Button(
                    {
                        data: {
                            content: "Сохранить",
                            title: "Сохранить местоположение"
                        },
                        options: {
                            maxWidth: [180],
                            selectOnClick: false
                        }
                    }
                )

                weatherButton.events.add(
                    'click',
                    getCityName
                )
                map.controls.add(weatherButton)

                getCoords()
                getCityName()
            }
            ymaps.ready(initMap)

            const getWeather = async () => {
                const latitude = coords[0]
                const longitude = coords[1]

                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FMoscow`)
                const data = await response.json()

                dates = data.daily.time
                dates = dates.map(date => {
                    date = date.split("-")
                    return new Date(Number(date[0]), Number(date[1]) - 1, Number(date[2]))
                })

                dates[0] = [dates[0], "СЕГОДНЯ"]
                dates[1] = [dates[1], "ЗАВТРА"]
                for (let i = 2; i < 7; i++) {
                    const weekDay = getWeekDay(dates[i])
                    dates[i] = [dates[i], weekDay]
                }

                temperatureNow = data.current.temperature_2m
                temperatureForWeekMax = data.daily.temperature_2m_max
                temperatureForWeekMin = data.daily.temperature_2m_min
            }

            const setWeather = () => {
                weatherToday.innerHTML = temperatureNow + "°C"

                for (let i = 0; i < 7; i++) {
                    const date = document.querySelector(`.appWeatherTemperatureWeek${i}`)
                    date.innerHTML = `${dates[i][1]} Max: ${temperatureForWeekMax[i]}°C / Min: ${temperatureForWeekMin[i]}°C`
                }
            }
            const setData = async () => {
                await getWeather()
                await setWeather()
            }

            weatherBtn.addEventListener('click', setData)

            setData()
            res(1)
        }, 3000)
    })
        .then(() => {
            const loader = document.querySelector(".loader")
            loader.className = "hidden"
        })
}
