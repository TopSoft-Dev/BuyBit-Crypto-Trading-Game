document.addEventListener('DOMContentLoaded', () => {
    // Wykrywanie urządzeń mobilnych
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Dodaj klasę mobile do body jeśli to urządzenie mobilne
    if (isMobile) {
        document.body.classList.add('mobile');
        console.log('Wykryto urządzenie mobilne');
    }
    
    // Nasłuchiwanie na zmiany orientacji i rozmiaru ekranu
    function handleOrientationChange() {
        const currentIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (currentIsMobile && !document.body.classList.contains('mobile')) {
            document.body.classList.add('mobile');
            console.log('Przełączono na widok mobilny');
        } else if (!currentIsMobile && document.body.classList.contains('mobile')) {
            document.body.classList.remove('mobile');
            console.log('Przełączono na widok desktopowy');
        }
        
        // Przeładuj wykres jeśli istnieje
        if (chart) {
            setTimeout(() => {
                chart.timeScale().fitContent();
            }, 100);
        }
    }
    
    // Nasłuchiwanie na zmiany rozmiaru okna i orientacji
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleOrientationChange, 100);
    });
    
    // Dodatkowe funkcje mobilne
    if (isMobile) {
        // Zapobiega zoom przy podwójnym dotknięciu
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Dodaj wskazówki dla użytkowników mobilnych
        console.log('Tryb mobilny aktywny - skróty klawiszowe wyłączone');
        
        // Swipe functionality removed for better chart behavior
    }
    
    // --- USTAWIENIA GRY ---
    const STARTING_BALANCE = 1000;
    const MAX_HISTORY_CANDLES = 100;
    
    // Ustawienia gry
    let gameSettings = {
        gameDuration: 200,
        autoCandles: false,
        autoSpeed: 3,
        simulateFees: true // Domyślnie włączone
    };
    
    let autoTimer = null;

    // Funkcje localStorage
    function saveGameSettings() {
        try {
            localStorage.setItem('buybit-game-settings', JSON.stringify(gameSettings));
            console.log('Ustawienia zapisane:', gameSettings);
        } catch (error) {
            console.error('Błąd zapisywania ustawień:', error);
        }
    }

    function loadGameSettings() {
        try {
            const saved = localStorage.getItem('buybit-game-settings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                gameSettings = { ...gameSettings, ...parsedSettings };
                console.log('Ustawienia załadowane:', gameSettings);
                
                // Zastosuj ustawienia do elementów UI
                if (assetSelect && parsedSettings.asset) {
                    assetSelect.value = parsedSettings.asset;
                }
                if (intervalSelect && parsedSettings.interval) {
                    intervalSelect.value = parsedSettings.interval;
                }
                if (parsedSettings.marginMode) {
                    marginModeInputs.forEach(input => {
                        if (input.value === parsedSettings.marginMode) {
                            input.checked = true;
                        }
                    });
                }
                
                // Załaduj stan wskaźników
                if (parsedSettings.showRSI !== undefined) {
                    gameState.showRSI = parsedSettings.showRSI;
                    if (toggleRsiBtn) toggleRsiBtn.classList.toggle('active', gameState.showRSI);
                    if (toggleRsiMobileBtn) toggleRsiMobileBtn.classList.toggle('active', gameState.showRSI);
                }
                if (parsedSettings.showMACD !== undefined) {
                    gameState.showMACD = parsedSettings.showMACD;
                    if (toggleMacdBtn) toggleMacdBtn.classList.toggle('active', gameState.showMACD);
                    if (toggleMacdMobileBtn) toggleMacdMobileBtn.classList.toggle('active', gameState.showMACD);
                }
                if (parsedSettings.showBB !== undefined) {
                    gameState.showBB = parsedSettings.showBB;
                    if (toggleBbBtn) toggleBbBtn.classList.toggle('active', gameState.showBB);
                    if (toggleBbMobileBtn) toggleBbMobileBtn.classList.toggle('active', gameState.showBB);
                }
                if (parsedSettings.showEMA !== undefined) {
                    gameState.showEMA = parsedSettings.showEMA;
                    if (toggleEmaBtn) toggleEmaBtn.classList.toggle('active', gameState.showEMA);
                    if (toggleEmaMobileBtn) toggleEmaMobileBtn.classList.toggle('active', gameState.showEMA);
                }
                if (parsedSettings.showTMA !== undefined) {
                    gameState.showTMA = parsedSettings.showTMA;
                    if (toggleTmaBtn) toggleTmaBtn.classList.toggle('active', gameState.showTMA);
                    if (toggleTmaMobileBtn) toggleTmaMobileBtn.classList.toggle('active', gameState.showTMA);
                }
                
                // Załaduj ustawienie prowizji
                if (parsedSettings.simulateFees !== undefined) {
                    gameSettings.simulateFees = parsedSettings.simulateFees;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Błąd ładowania ustawień:', error);
        }
        return false;
    }

    function saveAllSettings() {
        const allSettings = {
            ...gameSettings,
            asset: assetSelect ? assetSelect.value : 'BTC',
            interval: intervalSelect ? intervalSelect.value : '15m',
            marginMode: gameState.marginMode || 'isolated',
            showRSI: gameState.showRSI || false,
            showMACD: gameState.showMACD || false,
            showBB: gameState.showBB || false,
            showEMA: gameState.showEMA || false,
            showTMA: gameState.showTMA || false,
            simulateFees: gameSettings.simulateFees || false
        };
        
        try {
            localStorage.setItem('buybit-game-settings', JSON.stringify(allSettings));
            console.log('Wszystkie ustawienia zapisane:', allSettings);
        } catch (error) {
            console.error('Błąd zapisywania ustawień:', error);
        }
    }

    // --- ELEMENTY DOM ---
    const balanceEl = document.getElementById('balance');
    const totalPlUsdEl = document.getElementById('total-pl-usd');
    const totalPlPercentEl = document.getElementById('total-pl-percent');
    const timeLeftEl = document.getElementById('time-left');
    const assetSelect = document.getElementById('asset');
    const intervalSelect = document.getElementById('interval');
    
    // Elementy mobilne
    const balanceMobileEl = document.getElementById('balance-mobile');
    const totalPlMobileEl = document.getElementById('total-pl-mobile');
    const timeLeftMobileEl = document.getElementById('time-left-mobile');
    const assetMobileSelect = document.getElementById('asset-mobile');
    const intervalMobileSelect = document.getElementById('interval-mobile');
    const chartContainer = document.getElementById('chart-container');
    const amountInput = document.getElementById('amount');
    const amountSlider = document.getElementById('amount-slider');
    const leverageInput = document.getElementById('leverage');
    const leverageValueEl = document.getElementById('leverage-value');
    const longBtn = document.getElementById('long-btn');
    const shortBtn = document.getElementById('short-btn');
    const closeBtn = document.getElementById('close-btn');
    const nextCandleBtn = document.getElementById('next-candle-btn');
    const posDirectionEl = document.getElementById('pos-direction');
    const posSizeEl = document.getElementById('pos-size');
    const posEntryPriceEl = document.getElementById('pos-entry-price');
    const posLiquidationPriceEl = document.getElementById('pos-liquidation-price');
    const posPlEl = document.getElementById('pos-pl');
    const marginModeInputs = document.querySelectorAll('input[name="margin-mode"]');
    
    // Elementy mobilne - kontrole
    const amountMobileInput = document.getElementById('amount-mobile');
    const amountMobileSlider = document.getElementById('amount-slider-mobile');
    const leverageMobileInput = document.getElementById('leverage-mobile');
    const leverageMobileValueEl = document.getElementById('leverage-value-mobile');
    const longMobileBtn = document.getElementById('long-btn-mobile');
    const shortMobileBtn = document.getElementById('short-btn-mobile');
    const closeMobileBtn = document.getElementById('close-btn-mobile');
    const nextCandleMobileBtn = document.getElementById('next-candle-btn-mobile');
    const posDirectionMobileEl = document.getElementById('pos-direction-mobile');
    const posSizeMobileEl = document.getElementById('pos-size-mobile');
    const posEntryPriceMobileEl = document.getElementById('pos-entry-price-mobile');
    const posLiquidationPriceMobileEl = document.getElementById('pos-liquidation-price-mobile');
    const posPlMobileEl = document.getElementById('pos-pl-mobile');
    
    // Kompaktowe elementy pozycji w karcie wykresu
    const posDirectionCompactEl = document.getElementById('pos-direction-compact');
    const posPlCompactEl = document.getElementById('pos-pl-compact');
    const marginModeMobileInputs = document.querySelectorAll('input[name="margin-mode-mobile"]');
    const notificationPopup = document.getElementById('notification-popup');
    const toggleRsiBtn = document.getElementById('toggle-rsi-btn');
    const toggleMacdBtn = document.getElementById('toggle-macd-btn');
    const toggleBbBtn = document.getElementById('toggle-bb-btn');
    const toggleEmaBtn = document.getElementById('toggle-ema-btn');
    const toggleTmaBtn = document.getElementById('toggle-tma-btn');
    
    // Przyciski wskaźników mobilne
    const toggleRsiMobileBtn = document.getElementById('toggle-rsi-btn-mobile');
    const toggleMacdMobileBtn = document.getElementById('toggle-macd-btn-mobile');
    const toggleBbMobileBtn = document.getElementById('toggle-bb-btn-mobile');
    const toggleEmaMobileBtn = document.getElementById('toggle-ema-btn-mobile');
    const toggleTmaMobileBtn = document.getElementById('toggle-tma-btn-mobile');
    const endGameModal = document.getElementById('end-game-modal');
    const endGameMessage = document.getElementById('end-game-message');
    const endGameOkBtn = document.getElementById('end-game-ok-btn');
    const saveScoreBtn = document.getElementById('save-score-btn');
    
    // Elementy dla welcome modal
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeRulesBtn = document.getElementById('welcome-rules-btn');
    const welcomeStartBtn = document.getElementById('welcome-start-btn');
    
    // Nowe elementy dla zasad gry
    const gameRulesBtn = document.getElementById('game-rules-btn');
    const gameRulesModal = document.getElementById('game-rules-modal');
    const gameRulesCancelBtn = document.getElementById('rules-cancel-btn');
    const gameRulesApplyBtn = document.getElementById('rules-apply-btn');
    const gameDurationInput = document.getElementById('game-duration');
    const autoCandlesCheckbox = document.getElementById('auto-candles');
    const autoSpeedSlider = document.getElementById('auto-speed');
    const autoSpeedValue = document.getElementById('auto-speed-value');
    const autoSpeedGroup = document.getElementById('auto-speed-group');
    const simulateFeesCheckbox = document.getElementById('simulate-fees');
    
    // Elementy dla tabeli wyników
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const saveScoreModal = document.getElementById('save-score-modal');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const playerNameInput = document.getElementById('player-name');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const cancelSaveBtn = document.getElementById('cancel-save-btn');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
    // Usunięto przyciski sortowania - zawsze sortowanie po saldzie
    const clearLeaderboardBtn = document.getElementById('clear-leaderboard');
    const leaderboardContent = document.getElementById('leaderboard-content');
    const finalScoreEl = document.getElementById('final-score');
    const finalPlEl = document.getElementById('final-pl');
    const finalEfficiencyEl = document.getElementById('final-efficiency');

    // --- STAN GRY ---
    let chart;
    let candleSeries;
    let historicalData = [];
    let gameState = {};
    let gameStarted = false; // Flaga czy gra została rozpoczęta
    let currentGameResult = null; // Przechowuje wynik końcowy gry do zapisania
    let rsiSeries; // Nowa seria dla RSI
let macdHistogramSeries; // Nowa seria dla MACD Histogram
let macdLineSeries; // Nowa seria dla MACD Line
let signalLineSeries; // Nowa seria dla Signal Line
let positionLineSeries; // Nowa seria dla linii pozycji
let liquidationLineSeries; // Seria dla linii likwidacji w osobnym panelu
let bbUpperSeries, bbLowerSeries, bbMiddleSeries; // Bollinger Bands
let ema9Series, ema50Series, ema200Series; // EMA Lines
let tmaUpperSeries, tmaLowerSeries, tmaMiddleSeries; // TMA Bands

    function formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Funkcje pomocnicze do zarządzania pozycjami
    function hasActivePositions() {
        return gameState.positions.length > 0;
    }

    function getTotalPositionSize() {
        return gameState.positions.reduce((total, pos) => total + pos.size, 0);
    }

    function getAverageEntryPrice() {
        if (gameState.positions.length === 0) return 0;
        const totalValue = gameState.positions.reduce((total, pos) => total + (pos.entryPrice * pos.size), 0);
        const totalSize = getTotalPositionSize();
        return totalValue / totalSize;
    }

    function getTotalLeverage() {
        if (gameState.positions.length === 0) return 1;
        const totalLeveragedSize = gameState.positions.reduce((total, pos) => total + (pos.size * pos.leverage), 0);
        const totalSize = getTotalPositionSize();
        return totalLeveragedSize / totalSize;
    }

    function calculateLiquidationPrice() {
        if (gameState.positions.length === 0) return 0;
        
        const avgEntryPrice = getAverageEntryPrice();
        const totalLeverage = getTotalLeverage();
        
        if (gameState.marginMode === 'isolated') {
            // W trybie isolated, likwidacja następuje gdy strata = 100% marży
            // Maksymalna strata = marża = pozycja / dźwignia
            const liquidationDistance = avgEntryPrice / totalLeverage;
            return gameState.activeDirection === 'long' 
                ? avgEntryPrice - liquidationDistance 
                : avgEntryPrice + liquidationDistance;
        } else {
            // W trybie cross, likwidacja następuje gdy całe saldo konta = 0
            const totalPositionValue = getTotalPositionSize();
            const totalLeveragedValue = totalPositionValue * totalLeverage;
            const liquidationDistance = (gameState.balance / totalLeveragedValue) * avgEntryPrice;
            return gameState.activeDirection === 'long' 
                ? avgEntryPrice - liquidationDistance 
                : avgEntryPrice + liquidationDistance;
        }
    }

    // Funkcja do obliczania RSI
    function calculateRSI(data, period = 14) {
        const rsiData = [];
        if (data.length < period) return rsiData;

        let avgGain = 0;
        let avgLoss = 0;

        // Oblicz początkowe średnie dla pierwszych 'period' świec
        for (let i = 1; i <= period; i++) {
            const change = data[i].close - data[i - 1].close;
            if (change > 0) {
                avgGain += change;
            } else {
                avgLoss += Math.abs(change);
            }
        }
        avgGain /= period;
        avgLoss /= period;

        for (let i = period; i < data.length; i++) {
            const currentChange = data[i].close - data[i - 1].close;
            let gain = 0;
            let loss = 0;

            if (currentChange > 0) {
                gain = currentChange;
            } else {
                loss = Math.abs(currentChange);
            }

            // Wygładzanie średnich (Wilder's smoothing)
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            let rs = 0;
            if (avgLoss !== 0) {
                rs = avgGain / avgLoss;
            }

            const rsi = 100 - (100 / (1 + rs));
            rsiData.push({ time: data[i].time, value: rsi });
        }
        return rsiData;
    }

    // Funkcja do obliczania MACD
    function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const macdData = [];
        if (data.length < slowPeriod) return macdData;

        const calculateEMA = (prices, period) => {
            const k = 2 / (period + 1);
            const emaValues = [];
            emaValues[0] = prices[0];

            for (let i = 1; i < prices.length; i++) {
                emaValues[i] = (prices[i] * k) + (emaValues[i - 1] * (1 - k));
            }
            return emaValues;
        };

        const closes = data.map(d => d.close);

        const emaFast = calculateEMA(closes, fastPeriod);
        const emaSlow = calculateEMA(closes, slowPeriod);

        const macdLine = [];
        for (let i = 0; i < emaFast.length; i++) {
            if (emaSlow[i] !== undefined) {
                macdLine.push(emaFast[i] - emaSlow[i]);
            } else {
                macdLine.push(undefined);
            }
        }

        const signalLine = calculateEMA(macdLine.filter(val => val !== undefined), signalPeriod);

        for (let i = 0; i < macdLine.length; i++) {
            if (macdLine[i] !== undefined && signalLine[i - (macdLine.length - signalLine.length)] !== undefined) {
                macdData.push({
                    time: data[i].time,
                    value: macdLine[i],
                    signal: signalLine[i - (macdLine.length - signalLine.length)],
                    histogram: macdLine[i] - signalLine[i - (macdLine.length - signalLine.length)],
                });
            }
        }
        return macdData;
    }

    function calculateBollingerBands(data, period = 20, stdDev = 2) {
        if (data.length < period) return [];

        const result = [];
        const prices = data.map(item => item.close);

        for (let i = period - 1; i < data.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const mean = slice.reduce((sum, price) => sum + price, 0) / period;
            const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);

            result.push({
                time: data[i].time,
                upper: mean + (stdDev * standardDeviation),
                middle: mean,
                lower: mean - (stdDev * standardDeviation)
            });
        }

        return result;
    }

    function calculateEMALine(data, period) {
        if (data.length < period) return [];

        const result = [];
        const prices = data.map(item => item.close);
        const multiplier = 2 / (period + 1);

        // Pierwszy EMA to średnia z pierwszych 'period' elementów
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        let ema = sum / period;
        result.push({ time: data[period - 1].time, value: ema });

        // Kolejne EMA
        for (let i = period; i < data.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
            result.push({ time: data[i].time, value: ema });
        }

        return result;
    }

    function calculateTMA(data, period = 20, atrPeriod = 14) {
        if (data.length < Math.max(period, atrPeriod)) return [];

        // Triangular Moving Average
        const tma = [];
        const prices = data.map(item => item.close);
        
        // Najpierw oblicz SMA z połowy okresu
        const halfPeriod = Math.floor(period / 2) + 1;
        const sma1 = [];
        
        for (let i = halfPeriod - 1; i < data.length; i++) {
            const slice = prices.slice(i - halfPeriod + 1, i + 1);
            const avg = slice.reduce((sum, price) => sum + price, 0) / halfPeriod;
            sma1.push(avg);
        }
        
        // Potem oblicz SMA z pierwszego SMA
        for (let i = halfPeriod - 1; i < sma1.length; i++) {
            const slice = sma1.slice(i - halfPeriod + 1, i + 1);
            const avg = slice.reduce((sum, val) => sum + val, 0) / halfPeriod;
            tma.push(avg);
        }

        // Oblicz ATR dla band
        const atr = [];
        for (let i = 1; i < data.length; i++) {
            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            );
            atr.push(tr);
        }

        // Średnia z ATR
        const result = [];
        const startIndex = Math.max(period, atrPeriod);
        
        for (let i = startIndex - 1; i < data.length; i++) {
            const tmaIndex = i - startIndex + 1;
            if (tmaIndex >= 0 && tmaIndex < tma.length) {
                const atrSlice = atr.slice(Math.max(0, i - atrPeriod), i);
                const avgATR = atrSlice.reduce((sum, val) => sum + val, 0) / atrSlice.length;
                
                result.push({
                    time: data[i].time,
                    upper: tma[tmaIndex] + (avgATR * 1.5),
                    middle: tma[tmaIndex],
                    lower: tma[tmaIndex] - (avgATR * 1.5)
                });
            }
        }

        return result;
    }

    function showChartMessage(message) {
        chartContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-color);">${message}</div>`;
    }

    function autoFitChart() {
        if (!chart || !chart.timeScale) return;
        
        // W wersji mobilnej, nie resetuj pozycji wykresu podczas gry
        if (document.body.classList.contains('mobile') && gameStarted) {
            return; // Nie rób nic w wersji mobilnej po rozpoczęciu gry
        }
        
        // Teraz gdy linia likwidacji jest w osobnym panelu, możemy użyć standardowego fitContent
        setTimeout(() => {
            chart.timeScale().fitContent();
        }, 50);
    }

    function smartScrollToNewCandle() {
        if (!chart || !chart.timeScale) return;
        
        try {
            // Pobierz aktualny widoczny zakres
            const visibleRange = chart.timeScale().getVisibleRange();
            if (!visibleRange) {
                return; // Nie rób nic jeśli nie ma zakresu
            }
            
            // Pobierz dane świec
            const candleData = candleSeries.data();
            if (!candleData || candleData.length === 0) return;
            
            const lastCandleTime = candleData[candleData.length - 1].time;
            
            // Sprawdź czy użytkownik ogląda najnowsze dane (ostatnia świeca jest widoczna)
            const isViewingLatest = lastCandleTime >= visibleRange.from && lastCandleTime <= visibleRange.to;
            
            if (isViewingLatest) {
                // Jeśli użytkownik ogląda najnowsze dane, przesuń wykres o jedną świecę w lewo
                // tak jak w prawdziwym tradingu - nowa świeca pojawia się po prawej stronie
                const rangeWidth = visibleRange.to - visibleRange.from;
                const candleInterval = candleData.length > 1 ? 
                    candleData[candleData.length - 1].time - candleData[candleData.length - 2].time : 
                    900; // 15 minut jako fallback
                
                chart.timeScale().setVisibleRange({
                    from: visibleRange.from + candleInterval,
                    to: visibleRange.to + candleInterval
                });
            }
            // Jeśli użytkownik przegląda historię, nie rób nic - pozwól mu oglądać
            
        } catch (error) {
            console.log('Błąd przy przewijaniu wykresu:', error);
        }
    }

    function showNotification(message, type = 'info') {
        const notificationText = notificationPopup.querySelector('p');
        notificationText.textContent = message;
        notificationPopup.className = ''; // Resetuj klasy
        notificationPopup.classList.add(type, 'show');
        setTimeout(() => {
            notificationPopup.classList.remove('show');
        }, 2500); // Komunikat znika po 2.5 sekundy
    }

    // Funkcja do aktualizacji wypełnienia suwaka
    function updateSliderFill(sliderElement) {
        const value = parseFloat(sliderElement.value);
        const min = parseFloat(sliderElement.min);
        const max = parseFloat(sliderElement.max);
        const percentage = ((value - min) / (max - min)) * 100;
        sliderElement.style.setProperty('--track-fill-percentage', `${percentage}%`);
    }

    function resetGameState() {
        // Zachowaj stan wskaźników przed resetem
        const preservedIndicators = {
            showRSI: gameState.showRSI || false,
            showMACD: gameState.showMACD || false,
            showBB: gameState.showBB || false,
            showEMA: gameState.showEMA || false,
            showTMA: gameState.showTMA || false,
        };
        
        gameState = {
            balance: STARTING_BALANCE,
            asset: assetSelect.value,
            interval: intervalSelect.value, // Dodany interwał
            candlesPassed: 0,
            currentDataIndex: 0,
            isGameReady: false,
            gameDuration: gameSettings.gameDuration,
            marginMode: 'isolated', // Domyślny tryb
            markers: [], // Tablica na znaczniki transakcji
            positions: [], // Tablica pozycji w jednym kierunku
            activeDirection: null, // 'long' lub 'short' - aktywny kierunek pozycji
            showRSI: preservedIndicators.showRSI, // Zachowaj stan RSI
            showMACD: preservedIndicators.showMACD, // Zachowaj stan MACD
            showBB: preservedIndicators.showBB, // Zachowaj stan Bollinger Bands
            showEMA: preservedIndicators.showEMA, // Zachowaj stan EMA
            showTMA: preservedIndicators.showTMA, // Zachowaj stan TMA Bands
            totalTrades: 0, // Licznik wszystkich zagrań
            profitableTrades: 0, // Licznik zyskownych zagrań
            losingTrades: 0, // Licznik stratnych zagrań
        };
        // Ustaw początkowe wypełnienie suwaków
        updateSliderFill(amountSlider);
        updateSliderFill(leverageInput);
    }

    // Funkcje obsługi welcome modal
    function showWelcomeModal() {
        if (!welcomeModal) return;
        welcomeModal.classList.remove('hidden');
        welcomeModal.classList.add('show');
        
        // Dodaj informację o trybie mobilnym
        if (document.body.classList.contains('mobile')) {
            const welcomeContent = document.querySelector('.welcome-content p');
            if (welcomeContent) {
                welcomeContent.innerHTML = 'Przetestuj swoje umiejętności w tradingu kryptowalut bez ryzyka!<br><small style="color: #f7931a;">Tryb mobilny: Użyj przycisku "Następna Świeca" aby przejść dalej</small>';
            }
        }
    }

    function hideWelcomeModal() {
        if (!welcomeModal) return;
        welcomeModal.classList.remove('show');
        welcomeModal.classList.add('hidden');
    }

    // Funkcje obsługi modala z zasadami gry
    function showGameRulesModal() {
        if (!gameRulesModal) return;
        
        if (gameDurationInput) gameDurationInput.value = gameSettings.gameDuration;
        if (autoCandlesCheckbox) autoCandlesCheckbox.checked = gameSettings.autoCandles;
        if (autoSpeedSlider) autoSpeedSlider.value = gameSettings.autoSpeed;
        if (autoSpeedValue) autoSpeedValue.textContent = gameSettings.autoSpeed + 's';
        if (simulateFeesCheckbox) simulateFeesCheckbox.checked = gameSettings.simulateFees;
        
        if (autoSpeedGroup) {
            if (gameSettings.autoCandles) {
                autoSpeedGroup.classList.add('enabled');
            } else {
                autoSpeedGroup.classList.remove('enabled');
            }
        }
        
        // Ukryj przycisk "Anuluj" jeśli gra się nie rozpoczęła
        if (gameRulesCancelBtn) {
            if (gameStarted) {
                gameRulesCancelBtn.style.display = 'block';
            } else {
                gameRulesCancelBtn.style.display = 'none';
            }
        }
        
        gameRulesModal.classList.remove('hidden');
        gameRulesModal.classList.add('show');
    }

    function hideGameRulesModal() {
        if (!gameRulesModal) return;
        gameRulesModal.classList.remove('show');
        gameRulesModal.classList.add('hidden');
    }

    function applyGameSettings() {
        gameSettings.gameDuration = parseInt(gameDurationInput.value);
        gameSettings.autoCandles = autoCandlesCheckbox.checked;
        gameSettings.autoSpeed = parseInt(autoSpeedSlider.value);
        gameSettings.simulateFees = simulateFeesCheckbox.checked;
        
        // Zapisz ustawienia w localStorage
        saveGameSettings();
        
        hideGameRulesModal();
        gameStarted = true;
        resetAndStartGame();
    }

    function startGameFromWelcome() {
        hideWelcomeModal();
        gameStarted = true;
        resetAndStartGame();
    }

    function startAutoTimer() {
        if (gameSettings.autoCandles && gameState.isGameReady && gameStarted) {
            autoTimer = setInterval(() => {
                if (!nextCandleBtn.disabled) {
                    showNextCandle();
                }
            }, gameSettings.autoSpeed * 1000);
        }
    }

    function stopAutoTimer() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    function setupChart() {
        // Wybierz odpowiedni kontener wykresu
        const activeChartContainer = document.body.classList.contains('mobile') ? 
            document.getElementById('chart-container-mobile') : 
            document.getElementById('chart-container');
        
        if (chart) {
            chart.remove();
            chart = null;
        }
        activeChartContainer.innerHTML = '';

        // Dostosuj wysokość dla urządzeń mobilnych
        function adjustChartHeight() {
            if (document.body.classList.contains('mobile')) {
                const screenHeight = window.innerHeight;
                const headerHeight = document.getElementById('header').offsetHeight;
                const controlsHeight = document.getElementById('header-controls') ? document.getElementById('header-controls').offsetHeight : 0;
                const availableHeight = screenHeight - headerHeight - controlsHeight - 150; // 150px margines na inne elementy
                
                const mobileHeight = Math.max(300, Math.min(availableHeight * 0.5, 400));
                activeChartContainer.style.height = mobileHeight + 'px';
                console.log('Mobile chart height adjusted to:', mobileHeight);
            }
        }
        
        adjustChartHeight();

        // Upewnij się, że kontener ma prawidłowe wymiary
        const containerRect = activeChartContainer.getBoundingClientRect();
        const width = Math.max(containerRect.width, 400);
        const height = Math.max(containerRect.height, 300);
        
        console.log('Chart container dimensions:', width, 'x', height);
        
        chart = LightweightCharts.createChart(activeChartContainer, {
            width: width,
            height: height,
            layout: { backgroundColor: '#131722', textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
            timeScale: { 
                timeVisible: true, 
                secondsVisible: false, 
                rightOffset: 15,
                lockVisibleTimeRangeOnResize: true, // Zachowaj zoom przy resize
                allowShiftVisibleRangeOnWhitespaceClick: true // Pozwól na przewijanie kliknięciem
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: {
                visible: true,
                borderColor: '#7164FA',
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350', borderDownColor: '#ef5350',
            borderUpColor: '#26a69a', wickDownColor: '#ef5350', wickUpColor: '#26a69a',
        });

        // Panele dla wskaźników
        const rsiPane = chart.addAreaSeries({
            pane: 1, // Nowy panel
            topColor: 'rgba(33, 150, 243, 0.56)',
            bottomColor: 'rgba(33, 150, 243, 0.04)',
            lineColor: 'rgba(33, 150, 243, 1)',
            lineWidth: 2,
            priceScaleId: 'rsi-scale',
        });
        rsiSeries = rsiPane; // Przypisanie do zmiennej globalnej
        chart.priceScale('rsi-scale').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            borderVisible: false,
            visible: false, // Domyślnie ukryte
        });

        const macdPane = chart.addHistogramSeries({
            pane: 2, // Nowy panel
            priceScaleId: 'macd-scale',
        });
        macdHistogramSeries = macdPane; // Przypisanie do zmiennej globalnej
        chart.priceScale('macd-scale').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            borderVisible: false,
            visible: false, // Domyślnie ukryte
        });

        const macdLinePane = chart.addLineSeries({
            pane: 2, // Ten sam panel co histogram
            color: '#2962FF',
            lineWidth: 2,
            priceScaleId: 'macd-scale',
        });
        macdLineSeries = macdLinePane; // Przypisanie do zmiennej globalnej

        const signalLinePane = chart.addLineSeries({
            pane: 2, // Ten sam panel co histogram
            color: '#FF6D00',
            lineWidth: 2,
            priceScaleId: 'macd-scale',
        });
        signalLineSeries = signalLinePane; // Przypisanie do zmiennej globalnej

        // Linia likwidacji (pierwotna wersja)
        liquidationLineSeries = chart.addLineSeries({
            color: '#FF4747', // Czerwony kolor
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dotted,
            visible: false,
        });

        // Ukryj serie wskaźników na początku
        rsiSeries.applyOptions({ visible: false });
        macdHistogramSeries.applyOptions({ visible: false });
        macdLineSeries.applyOptions({ visible: false });
        signalLineSeries.applyOptions({ visible: false });
        liquidationLineSeries.applyOptions({ visible: false });

        // Seria dla linii pozycji
        positionLineSeries = chart.addLineSeries({
            color: '#FFD700', // Złoty kolor dla linii pozycji
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dashed, // Linia przerywana
            visible: false,
        });

        // Zamiast linii likwidacji używamy markerów
        // liquidationLineSeries usunięte

        // Bollinger Bands
        bbUpperSeries = chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            visible: false,
        });
        bbMiddleSeries = chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            visible: false,
        });
        bbLowerSeries = chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            visible: false,
        });

        // EMA Lines
        ema9Series = chart.addLineSeries({
            color: '#2196F3', // Niebieski dla EMA 9
            lineWidth: 2,
            visible: false,
        });
        ema50Series = chart.addLineSeries({
            color: '#F44336', // Czerwony dla EMA 50
            lineWidth: 2,
            visible: false,
        });
        ema200Series = chart.addLineSeries({
            color: '#FFD700', // Żółty dla EMA 200
            lineWidth: 2,
            visible: false,
        });

        // TMA Bands
        tmaUpperSeries = chart.addLineSeries({
            color: '#FF9800',
            lineWidth: 1,
            visible: false,
        });
        tmaMiddleSeries = chart.addLineSeries({
            color: '#FF9800',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            visible: false,
        });
        tmaLowerSeries = chart.addLineSeries({
            color: '#FF9800',
            lineWidth: 1,
            visible: false,
        });

        // Dodaj obsługę resize bez automatycznego rozszerzania
        let lastWidth = 0;
        let lastHeight = 0;
        
        const resizeObserver = new ResizeObserver(entries => {
            if (chart && activeChartContainer) {
                const containerRect = activeChartContainer.getBoundingClientRect();
                
                // W wersji mobilnej, sprawdź czy kontener jest widoczny na ekranie
                if (document.body.classList.contains('mobile')) {
                    const isVisible = containerRect.top < window.innerHeight && containerRect.bottom > 0;
                    if (!isVisible) return; // Nie rób nic jeśli wykres nie jest widoczny
                }
                
                const width = Math.max(containerRect.width, 400);
                const height = Math.max(containerRect.height, 300);
                
                // Aktualizuj tylko jeśli rozmiar rzeczywiście się zmienił
                if (Math.abs(width - lastWidth) > 10 || Math.abs(height - lastHeight) > 10) {
                    chart.applyOptions({
                        width: width,
                        height: height
                    });
                    lastWidth = width;
                    lastHeight = height;
                    console.log('Chart resized to:', width, 'x', height);
                }
            }
        });
        
        resizeObserver.observe(activeChartContainer);
        
        // Dodaj obsługę touch eventów dla urządzeń mobilnych
        if (document.body.classList.contains('mobile')) {
            activeChartContainer.addEventListener('touchstart', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            activeChartContainer.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }
        
        // Dodaj event listener dla window resize
        window.addEventListener('resize', () => {
            if (chart && activeChartContainer) {
                adjustChartHeight(); // Dostosuj wysokość przy resize
                setTimeout(() => {
                    const containerRect = activeChartContainer.getBoundingClientRect();
                    const width = Math.max(containerRect.width, 400);
                    const height = Math.max(containerRect.height, 300);
                    chart.applyOptions({
                        width: width,
                        height: height
                    });
                    lastWidth = width;
                    lastHeight = height;
                }, 100);
            }
        });
    }

    async function loadData() {
        showChartMessage("Ładowanie danych...");
        const symbol = gameState.asset === 'BTC' ? 'BTCUSDT' : 'ETHUSDT';
        const interval = gameState.interval; // Używamy wybranego interwału
        const limit = 1000; // Maksymalnie 1000 świec na zapytanie
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const rawData = await response.json();
            if (!Array.isArray(rawData) || rawData.length === 0) throw new Error("Binance API zwróciło puste dane.");
            
            historicalData = rawData
                .map(d => ({
                    time: d[0] / 1000, // Konwersja milisekund na sekundy
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4])
                }))
                .filter(d => d.time && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close));
            
            setupChart();
            startSimulation();
        } catch (error) {
            console.error("Błąd ładowania danych:", error);
            showChartMessage("Błąd ładowania danych z Binance. Sprawdź konsolę przeglądarki.");
        }
    }

    function startSimulation() {
        historicalData.sort((a, b) => a.time - b.time);
        const MINIMUM_DATA_FOR_GAME = 40;
        if (historicalData.length < MINIMUM_DATA_FOR_GAME) {
            showChartMessage("Błąd krytyczny: Zbyt mało danych do rozpocz��cia gry.");
            return;
        }

        const historyToShow = Math.min(Math.floor(historicalData.length * 0.6), MAX_HISTORY_CANDLES);
        
        // Używamy długości gry z ustawień
        gameState.gameDuration = gameSettings.gameDuration;

        // Obliczamy maksymalny indeks, od którego możemy zacząć, aby mieć wystarczająco danych
        const maxStartIndex = historicalData.length - gameState.gameDuration - historyToShow;
        if (maxStartIndex < 0) {
            showChartMessage("Błąd: Za mało danych do symulacji o tej długości.");
            return;
        }

        // Losowy punkt startowy dla symulacji
        const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

        gameState.currentDataIndex = startIndex + historyToShow;
        const initialCandles = historicalData.slice(startIndex, gameState.currentDataIndex);
        candleSeries.setData(initialCandles);
        
        // Automatyczne dopasowanie zoom do widocznych świec tylko przy starcie
        // W wersji mobilnej, ustaw zoom tylko przy pierwszym uruchomieniu
        if (!document.body.classList.contains('mobile') || !gameStarted) {
            autoFitChart();
        }
        
        gameState.isGameReady = true;
        updateUI();
        candleSeries.setMarkers(gameState.markers);
        updateIndicators();
        
        // Uruchom automatyczny timer jeśli włączony i gra została rozpoczęta
        if (gameSettings.autoCandles && gameStarted) {
            startAutoTimer();
        }
    }

    function updateUI() {
        balanceEl.textContent = `${formatNumber(gameState.balance)}`;
        timeLeftEl.textContent = `${gameState.gameDuration - gameState.candlesPassed} świec`;
        leverageValueEl.textContent = `${leverageInput.value}x`;
        
        // Synchronizuj z elementami mobilnymi
        if (balanceMobileEl) balanceMobileEl.textContent = `${formatNumber(gameState.balance)}`;
        if (timeLeftMobileEl) timeLeftMobileEl.textContent = `${gameState.gameDuration - gameState.candlesPassed} świec`;
        if (leverageMobileValueEl) leverageMobileValueEl.textContent = `${leverageInput.value}x`;

        const totalPl = gameState.balance - STARTING_BALANCE;
        const totalPlPercent = (totalPl / STARTING_BALANCE) * 100;

        totalPlUsdEl.textContent = `(${formatNumber(totalPl)})`;
        totalPlPercentEl.textContent = `(${totalPlPercent >= 0 ? '+' : ''}${totalPlPercent.toFixed(2)}%)`;
        
        // Synchronizuj P/L z mobilnymi
        if (totalPlMobileEl) {
            totalPlMobileEl.textContent = `(${totalPlPercent >= 0 ? '+' : ''}${totalPlPercent.toFixed(2)}%)`;
        }
        
        const pnlClass = totalPl > 0 ? 'positive' : totalPl < 0 ? 'negative' : 'neutral';
        totalPlUsdEl.className = pnlClass;
        totalPlPercentEl.className = pnlClass;
        if (totalPlMobileEl) totalPlMobileEl.className = pnlClass;

        const hasPositions = hasActivePositions();
        nextCandleBtn.disabled = !gameState.isGameReady;
        closeBtn.disabled = !hasPositions;
        
        // Aktualizuj również przyciski mobilne
        if (nextCandleMobileBtn) nextCandleMobileBtn.disabled = !gameState.isGameReady;
        if (closeMobileBtn) closeMobileBtn.disabled = !hasPositions;
        
        // Ukryj przycisk "Następna świeca" w trybie automatycznym
        if (gameSettings.autoCandles) {
            nextCandleBtn.style.display = 'none';
        } else {
            nextCandleBtn.style.display = 'block';
        }
        
        // Wyłącz kontrole tylko gdy mamy pozycje
        [amountInput, amountSlider, leverageInput, assetSelect].forEach(el => el.disabled = hasPositions);
        marginModeInputs.forEach(input => input.disabled = hasPositions);
        
        // Synchronizuj z kontrolami mobilnymi
        if (amountMobileInput) amountMobileInput.disabled = hasPositions;
        if (amountMobileSlider) amountMobileSlider.disabled = hasPositions;
        if (leverageMobileInput) leverageMobileInput.disabled = hasPositions;
        if (assetMobileSelect) assetMobileSelect.disabled = hasPositions;
        if (marginModeMobileInputs) marginModeMobileInputs.forEach(input => input.disabled = hasPositions);
        
        // Logika dla przycisków long/short
        if (hasPositions) {
            // Jeśli mamy pozycje, wyłącz przycisk przeciwnego kierunku
            longBtn.disabled = gameState.activeDirection === 'short';
            shortBtn.disabled = gameState.activeDirection === 'long';
            if (longMobileBtn) longMobileBtn.disabled = gameState.activeDirection === 'short';
            if (shortMobileBtn) shortMobileBtn.disabled = gameState.activeDirection === 'long';
        } else {
            // Jeśli nie mamy pozycji, włącz oba przyciski
            longBtn.disabled = false;
            shortBtn.disabled = false;
            if (longMobileBtn) longMobileBtn.disabled = false;
            if (shortMobileBtn) shortMobileBtn.disabled = false;
        }

        // Aktualizuj maksymalną wartość suwaka i pola kwoty
        if (!hasPositions) {
            amountInput.max = gameState.balance;
            amountSlider.max = gameState.balance;
            if (amountMobileInput) amountMobileInput.max = gameState.balance;
            if (amountMobileSlider) amountMobileSlider.max = gameState.balance;
            
            // Skoryguj wartość suwaka, jeśli jest większa niż dostępne saldo
            if (parseFloat(amountInput.value) > gameState.balance) {
                amountInput.value = gameState.balance;
                amountSlider.value = gameState.balance;
                if (amountMobileInput) amountMobileInput.value = gameState.balance;
                if (amountMobileSlider) amountMobileSlider.value = gameState.balance;
            }
            updateSliderFill(amountSlider); // Zaktualizuj wypełnienie po ewentualnej korekcie
            if (amountMobileSlider) updateSliderFill(amountMobileSlider);
        }
    }

    function updateIndicators() {
        // Pobieramy tylko widoczny zakres świec dla wskaźników
        const startIndex = Math.max(0, gameState.currentDataIndex - MAX_HISTORY_CANDLES);
        const currentCandles = historicalData.slice(startIndex, gameState.currentDataIndex);

        // Aktualizacja RSI
        if (gameState.showRSI) {
            const rsiValues = calculateRSI(currentCandles);
            rsiSeries.setData(rsiValues);
            rsiSeries.applyOptions({ visible: true });
            chart.priceScale('rsi-scale').applyOptions({ visible: true });
        } else {
            rsiSeries.setData([]);
            rsiSeries.applyOptions({ visible: false });
            chart.priceScale('rsi-scale').applyOptions({ visible: false });
        }

        // Aktualizacja MACD
        if (gameState.showMACD) {
            const macdValues = calculateMACD(currentCandles);
            const macdHistogram = macdValues.map(d => ({ time: d.time, value: d.histogram, color: d.histogram >= 0 ? '#26a69a' : '#ef5350' }));
            const macdLine = macdValues.map(d => ({ time: d.time, value: d.value }));
            const signalLine = macdValues.map(d => ({ time: d.time, value: d.signal }));

            macdHistogramSeries.setData(macdHistogram);
            macdLineSeries.setData(macdLine);
            signalLineSeries.setData(signalLine);

            macdHistogramSeries.applyOptions({ visible: true });
            macdLineSeries.applyOptions({ visible: true });
            signalLineSeries.applyOptions({ visible: true });
            chart.priceScale('macd-scale').applyOptions({ visible: true });
        } else {
            macdHistogramSeries.setData([]);
            macdLineSeries.setData([]);
            signalLineSeries.setData([]);
            macdHistogramSeries.applyOptions({ visible: false });
            macdLineSeries.applyOptions({ visible: false });
            signalLineSeries.applyOptions({ visible: false });
            chart.priceScale('macd-scale').applyOptions({ visible: false });
        }

        // Aktualizacja Bollinger Bands
        if (gameState.showBB) {
            const bbValues = calculateBollingerBands(currentCandles);
            const bbUpper = bbValues.map(d => ({ time: d.time, value: d.upper }));
            const bbMiddle = bbValues.map(d => ({ time: d.time, value: d.middle }));
            const bbLower = bbValues.map(d => ({ time: d.time, value: d.lower }));

            bbUpperSeries.setData(bbUpper);
            bbMiddleSeries.setData(bbMiddle);
            bbLowerSeries.setData(bbLower);

            bbUpperSeries.applyOptions({ visible: true });
            bbMiddleSeries.applyOptions({ visible: true });
            bbLowerSeries.applyOptions({ visible: true });
        } else {
            bbUpperSeries.setData([]);
            bbMiddleSeries.setData([]);
            bbLowerSeries.setData([]);
            bbUpperSeries.applyOptions({ visible: false });
            bbMiddleSeries.applyOptions({ visible: false });
            bbLowerSeries.applyOptions({ visible: false });
        }

        // Aktualizacja EMA
        if (gameState.showEMA) {
            const ema9Values = calculateEMALine(currentCandles, 9);
            const ema50Values = calculateEMALine(currentCandles, 50);
            const ema200Values = calculateEMALine(currentCandles, 200);

            ema9Series.setData(ema9Values);
            ema50Series.setData(ema50Values);
            ema200Series.setData(ema200Values);

            ema9Series.applyOptions({ visible: true });
            ema50Series.applyOptions({ visible: true });
            ema200Series.applyOptions({ visible: true });
        } else {
            ema9Series.setData([]);
            ema50Series.setData([]);
            ema200Series.setData([]);
            ema9Series.applyOptions({ visible: false });
            ema50Series.applyOptions({ visible: false });
            ema200Series.applyOptions({ visible: false });
        }

        // Aktualizacja TMA Bands
        if (gameState.showTMA) {
            const tmaValues = calculateTMA(currentCandles);
            const tmaUpper = tmaValues.map(d => ({ time: d.time, value: d.upper }));
            const tmaMiddle = tmaValues.map(d => ({ time: d.time, value: d.middle }));
            const tmaLower = tmaValues.map(d => ({ time: d.time, value: d.lower }));

            tmaUpperSeries.setData(tmaUpper);
            tmaMiddleSeries.setData(tmaMiddle);
            tmaLowerSeries.setData(tmaLower);

            tmaUpperSeries.applyOptions({ visible: true });
            tmaMiddleSeries.applyOptions({ visible: true });
            tmaLowerSeries.applyOptions({ visible: true });
        } else {
            tmaUpperSeries.setData([]);
            tmaMiddleSeries.setData([]);
            tmaLowerSeries.setData([]);
            tmaUpperSeries.applyOptions({ visible: false });
            tmaMiddleSeries.applyOptions({ visible: false });
            tmaLowerSeries.applyOptions({ visible: false });
        }

        // Nie zmieniamy zoom przy aktualizacji wskaźników
    }

    function updatePositionInfo() {
        if (hasActivePositions()) {
            const currentPrice = historicalData[gameState.currentDataIndex - 1].close;
            const pnl = calculateTotalPnl(currentPrice);
            const totalSize = getTotalPositionSize();
            const avgEntryPrice = getAverageEntryPrice();
            const totalLeverage = getTotalLeverage();
            const liquidationPrice = calculateLiquidationPrice();
            
            // Koloruj kierunek pozycji
            const direction = gameState.activeDirection.toUpperCase();
            const directionClass = gameState.activeDirection === 'long' ? 'positive' : 'negative';
            const sizeText = `${formatNumber(totalSize * totalLeverage)} (${formatNumber(totalSize)}x${totalLeverage.toFixed(1)})`;
            const entryPriceText = `${formatNumber(avgEntryPrice)}`;
            const liquidationPriceText = `${formatNumber(liquidationPrice)}`;
            const pnlText = `${formatNumber(pnl)}`;
            const pnlClass = pnl >= 0 ? 'positive' : 'negative';
            
            // Desktop
            posDirectionEl.textContent = direction;
            posDirectionEl.className = directionClass;
            posSizeEl.textContent = sizeText;
            posEntryPriceEl.textContent = entryPriceText;
            posLiquidationPriceEl.textContent = liquidationPriceText;
            posLiquidationPriceEl.className = 'negative';
            posPlEl.textContent = pnlText;
            posPlEl.className = pnlClass;
            
            // Mobile
            if (posDirectionMobileEl) {
                posDirectionMobileEl.textContent = direction;
                posDirectionMobileEl.className = directionClass;
            }
            if (posSizeMobileEl) posSizeMobileEl.textContent = sizeText;
            if (posEntryPriceMobileEl) posEntryPriceMobileEl.textContent = entryPriceText;
            if (posLiquidationPriceMobileEl) {
                posLiquidationPriceMobileEl.textContent = liquidationPriceText;
                posLiquidationPriceMobileEl.className = 'negative';
            }
            if (posPlMobileEl) {
                posPlMobileEl.textContent = pnlText;
                posPlMobileEl.className = pnlClass;
            }
            
            // Kompaktowe elementy w karcie wykresu
            if (posDirectionCompactEl) {
                posDirectionCompactEl.textContent = direction;
                posDirectionCompactEl.className = directionClass;
            }
            if (posPlCompactEl) {
                posPlCompactEl.textContent = pnlText;
                posPlCompactEl.className = pnlClass;
            }
        } else {
            // Desktop
            posDirectionEl.textContent = '--';
            posDirectionEl.className = 'neutral';
            posSizeEl.textContent = '--';
            posEntryPriceEl.textContent = '--';
            posLiquidationPriceEl.textContent = '--';
            posLiquidationPriceEl.className = 'neutral';
            posPlEl.textContent = '$0.00';
            posPlEl.className = 'neutral';
            
            // Mobile
            if (posDirectionMobileEl) {
                posDirectionMobileEl.textContent = '--';
                posDirectionMobileEl.className = 'neutral';
            }
            if (posSizeMobileEl) posSizeMobileEl.textContent = '--';
            if (posEntryPriceMobileEl) posEntryPriceMobileEl.textContent = '--';
            if (posLiquidationPriceMobileEl) {
                posLiquidationPriceMobileEl.textContent = '--';
                posLiquidationPriceMobileEl.className = 'neutral';
            }
            if (posPlMobileEl) {
                posPlMobileEl.textContent = '$0.00';
                posPlMobileEl.className = 'neutral';
            }
            
            // Kompaktowe elementy w karcie wykresu
            if (posDirectionCompactEl) {
                posDirectionCompactEl.textContent = '--';
                posDirectionCompactEl.className = 'neutral';
            }
            if (posPlCompactEl) {
                posPlCompactEl.textContent = '$0.00';
                posPlCompactEl.className = 'neutral';
            }
        }
    }

    function addChartMarker(time, price, type, text, color, position, textColor = '#FFFFFF', id = null) {
        const marker = {
            time: time,
            position: position,
            color: color,
            shape: type,
            text: text,
            price: price,
            textColor: textColor,
        };
        
        // Dodaj ID jeśli zostało podane
        if (id) {
            marker.id = id;
        }
        
        gameState.markers.push(marker);
        candleSeries.setMarkers(gameState.markers);
    }

    function openPosition(direction) {
        if (!gameState.isGameReady) return;
        const amount = parseFloat(amountInput.value);
        const leverage = parseInt(leverageInput.value);
        if (amount <= 0 || amount > gameState.balance) {
            alert("Nieprawidłowa kwota!");
            return;
        }

        // Sprawdź czy można otworzyć pozycję w tym kierunku
        if (hasActivePositions() && gameState.activeDirection !== direction) {
            alert("Nie można otworzyć pozycji w przeciwnym kierunku!");
            return;
        }

        const entryCandle = historicalData[gameState.currentDataIndex - 1];
        
        // Oblicz prowizję jeśli jest włączona (0.1% od wartości pozycji)
        let fee = 0;
        if (gameSettings.simulateFees) {
            const positionValue = amount * leverage;
            fee = positionValue * 0.001; // 0.1% prowizji
        }
        
        // Dodaj nową pozycję do tablicy
        gameState.positions.push({
            entryPrice: entryCandle.close,
            size: amount,
            leverage: leverage,
            openTime: entryCandle.time,
            openFee: fee
        });
        
        // Ustaw aktywny kierunek jeśli to pierwsza pozycja
        if (!gameState.activeDirection) {
            gameState.activeDirection = direction;
        }
        
        gameState.balance -= amount + fee; // Odejmij kwotę pozycji + prowizję
        // Nie zwiększaj totalTrades tutaj - będzie zwiększany przy zamknięciu pozycji
        
        const markerType = direction === 'long' ? 'arrowUp' : 'arrowDown';
        const markerColor = direction === 'long' ? '#00C853' : '#D50000'; // Jaśniejsza zieleń/czerwień
        const markerPosition = direction === 'long' ? 'belowBar' : 'aboveBar';
        const markerText = direction === 'long' ? `L (x${leverage})` : `S (x${leverage})`;
        addChartMarker(entryCandle.time, entryCandle.close, markerType, markerText, markerColor, markerPosition);
        
        // Powiadomienie o prowizji jeśli jest włączona
        if (gameSettings.simulateFees && fee > 0) {
            showNotification(`Pozycja otwarta. Prowizja: $${fee.toFixed(2)}`, 'info');
        }

        updatePositionLines();
        updateUI();
        updatePositionInfo();
    }

    // Usunieto funkcje markerów likwidacji

    function updatePositionLines() {
        if (hasActivePositions()) {
            const currentTime = historicalData[gameState.currentDataIndex - 1].time;
            const avgEntryPrice = getAverageEntryPrice();
            const liquidationPrice = calculateLiquidationPrice();
            
            // Linia pozycji (średnia cena wejścia) na głównym wykresie
            positionLineSeries.setData([
                { time: gameState.positions[0].openTime, value: avgEntryPrice },
                { time: currentTime, value: avgEntryPrice }
            ]);
            positionLineSeries.applyOptions({ visible: true });
            
            // Linia likwidacji - tylko przy dźwigni 25x i wyżej
            const totalLeverage = getTotalLeverage();
            if (totalLeverage >= 25) {
                liquidationLineSeries.setData([
                    { time: gameState.positions[0].openTime, value: liquidationPrice },
                    { time: currentTime, value: liquidationPrice }
                ]);
                liquidationLineSeries.applyOptions({ visible: true });
            } else {
                liquidationLineSeries.applyOptions({ visible: false });
            }
        } else {
            positionLineSeries.applyOptions({ visible: false });
            liquidationLineSeries.applyOptions({ visible: false });
        }
    }

    function closePosition() {
        if (!hasActivePositions()) return;
        
        const exitPrice = historicalData[gameState.currentDataIndex - 1].close;
        const pnl = calculateTotalPnl(exitPrice);
        const totalSize = getTotalPositionSize();
        
        // Oblicz prowizję przy zamykaniu jeśli jest włączona
        let closeFee = 0;
        if (gameSettings.simulateFees) {
            const totalLeverage = getTotalLeverage();
            const positionValue = totalSize * totalLeverage;
            closeFee = positionValue * 0.001; // 0.1% prowizji
        }
        
        // Zwróć całkowitą kwotę pozycji plus P/L minus prowizja za zamknięcie
        gameState.balance += totalSize + pnl - closeFee;
        
        // Zwiększ licznik wszystkich zagrań (jeden trade = jeden cykl otwarcie->zamknięcie)
        gameState.totalTrades++;
        
        if (pnl >= 0) {
            gameState.profitableTrades++;
        } else {
            gameState.losingTrades++;
        }
        
        const markerColor = '#2962FF'; // Niebieski dla zamknięcia
        const markerType = gameState.activeDirection === 'long' ? 'arrowDown' : 'arrowUp'; // Przeciwny kierunek do otwarcia
        const markerPosition = gameState.activeDirection === 'long' ? 'aboveBar' : 'belowBar';
        const markerText = `C (${pnl >= 0 ? '+' : ''}${formatNumber(pnl)} USD)`;
        addChartMarker(historicalData[gameState.currentDataIndex - 1].time, exitPrice, markerType, markerText, markerColor, markerPosition);
        
        // Powiadomienie o prowizji przy zamykaniu jeśli jest włączona
        if (gameSettings.simulateFees && closeFee > 0) {
            showNotification(`Pozycja zamknięta. Prowizja: $${closeFee.toFixed(2)}`, 'info');
        }

        // Wyczyść wszystkie pozycje
        gameState.positions = [];
        gameState.activeDirection = null;
        
        // Ukryj linie pozycji i likwidacji
        positionLineSeries.applyOptions({ visible: false });
        liquidationLineSeries.applyOptions({ visible: false });

        updateUI();
        updatePositionInfo();
        checkGameOver();
    }

    function handleLiquidation() {
        showNotification("Twoja pozycja została zlikwidowana!", 'error');
        // W trybie Isolated tracisz tylko to, co zainwestowałeś (co już zostało odjęte od salda).
        // W trybie Cross, całe saldo jest wyzerowane.
        if (gameState.marginMode === 'cross') {
            gameState.balance = 0;
        }
        // Zwiększ licznik wszystkich zagrań (jeden trade = jeden cykl otwarcie->likwidacja)
        gameState.totalTrades++;
        gameState.losingTrades++; // Zwiększ licznik stratnych zagrań
        const liquidationPrice = historicalData[gameState.currentDataIndex - 1].close;
        const markerType = gameState.activeDirection === 'long' ? 'arrowDown' : 'arrowUp';
        const markerPosition = gameState.activeDirection === 'long' ? 'aboveBar' : 'belowBar';
        const markerText = gameState.activeDirection === 'long' ? 'L (Likwidacja)' : 'S (Likwidacja)';
        addChartMarker(historicalData[gameState.currentDataIndex - 1].time, liquidationPrice, markerType, markerText, '#FF6D00', markerPosition); // Pomarańczowy dla likwidacji

        // Wyczyść wszystkie pozycje
        gameState.positions = [];
        gameState.activeDirection = null;
        
        // Ukryj linie pozycji i likwidacji
        positionLineSeries.applyOptions({ visible: false });
        liquidationLineSeries.applyOptions({ visible: false });

        updateUI();
        updatePositionInfo();
        checkGameOver(); // Sprawdź, czy to koniec gry (saldo = 0)
    }

    function showNextCandle() {
        if (gameState.currentDataIndex >= historicalData.length) {
            endGame("win");
            return;
        }
        const nextCandle = historicalData[gameState.currentDataIndex];
        candleSeries.update(nextCandle);
        gameState.currentDataIndex++;
        gameState.candlesPassed++;

        updateIndicators(); // Aktualizuj wskaźniki z każdą nową świecą

        // Inteligentnie przewiń wykres zachowując zoom użytkownika
        smartScrollToNewCandle();

        if (hasActivePositions()) {
            const pnl = calculateTotalPnl(nextCandle.close);
            const totalSize = getTotalPositionSize();
            let isLiquidated = false;

            if (gameState.marginMode === 'isolated') {
                // Likwidacja, gdy strata zjada całą zainwestowaną kwotę
                if (totalSize + pnl <= 0) {
                    isLiquidated = true;
                }
            } else { // Tryb 'cross'
                // Likwidacja, gdy strata zjada całe saldo konta
                const totalEquity = gameState.balance + totalSize + pnl;
                if (totalEquity <= 0) {
                    isLiquidated = true;
                }
            }

            if (isLiquidated) {
                handleLiquidation();
                return; // Zakończ funkcję, aby nie aktualizować P/L itp.
            }
            
            // Aktualizuj linie pozycji przy każdej nowej świecy
            updatePositionLines();
            updatePositionInfo();
        }
        updateUI();
        checkGameOver();
    }

    function calculateTotalPnl(currentPrice) {
        if (gameState.positions.length === 0) return 0;
        
        return gameState.positions.reduce((totalPnl, position) => {
            const { entryPrice, size, leverage } = position;
            const priceChange = currentPrice - entryPrice;
            const pnlMultiplier = gameState.activeDirection === 'long' ? 1 : -1;
            const positionPnl = (priceChange / entryPrice) * size * leverage * pnlMultiplier;
            return totalPnl + positionPnl;
        }, 0);
    }

    function calculatePnl(currentPrice) {
        return calculateTotalPnl(currentPrice);
    }

    function checkGameOver() {
        // Koniec gry następuje TYLKO, gdy saldo spadnie do zera LUB gdy skończy się czas
        console.log('Sprawdzam koniec gry:', {
            balance: gameState.balance,
            candlesPassed: gameState.candlesPassed,
            gameDuration: gameState.gameDuration,
            hasActivePositions: hasActivePositions()
        });
        
        if (gameState.balance <= 0 && !hasActivePositions()) {
            console.log('Koniec gry - bankructwo');
            endGame("lose");
        } else if (gameState.candlesPassed >= gameState.gameDuration) {
            console.log('Koniec gry - czas się skończył');
            endGame("win");
        }
    }

    function endGame(outcome) {
        console.log('Koniec gry wywołany z outcome:', outcome);
        console.log('Stan gry:', {
            balance: gameState.balance,
            totalTrades: gameState.totalTrades,
            profitableTrades: gameState.profitableTrades,
            candlesPassed: gameState.candlesPassed,
            gameDuration: gameState.gameDuration
        });
        
        // Zatrzymaj automatyczny timer
        stopAutoTimer();
        
        // ZAWSZE zamknij pozycje przed obliczeniem wyniku końcowego
        if (hasActivePositions()) {
            console.log('Zamykam otwarte pozycje przed końcem gry');
            closePosition();
        }
        
        let finalBalance = gameState.balance;

        const totalPlPercent = ((finalBalance - STARTING_BALANCE) / STARTING_BALANCE) * 100;
        let efficiencyPercent = 0;
        if (gameState.totalTrades > 0) {
            efficiencyPercent = (gameState.profitableTrades / gameState.totalTrades) * 100;
        }

        let message = "";
        let type = 'info';

        if (outcome === 'lose') {
            finalBalance = 0; // Ustaw saldo na 0 w przypadku bankructwa
            message = `Koniec gry! Zbankrutowałeś. Twój wynik końcowy to ${formatNumber(finalBalance)}.`;
            type = 'error';
        } else {
            message = `Koniec gry! Twój wynik końcowy to ${formatNumber(finalBalance)}. Gratulacje!`;
            type = 'success';
        }
        
        console.log('Wywołuję showEndGameModal z:', { message, totalPlPercent, efficiencyPercent, type });
        showEndGameModal(message, totalPlPercent, efficiencyPercent, type);
    }

    function showEndGameModal(message, totalPlPercent, efficiencyPercent, type) {
        console.log('Wyświetlam modal końca gry:', message, totalPlPercent, efficiencyPercent, type);
        
        if (!endGameModal) {
            console.error('endGameModal nie istnieje!');
            return;
        }

        // Zapisz wynik gry do zmiennej globalnej
        currentGameResult = {
            balance: gameState.balance,
            plPercent: totalPlPercent,
            efficiency: efficiencyPercent,
            totalTrades: gameState.totalTrades,
            profitableTrades: gameState.profitableTrades
        };

        const titleEl = endGameModal.querySelector('#end-game-title');
        const percentagePlEl = document.getElementById('end-game-percentage-pl');
        const efficiencyEl = document.getElementById('end-game-efficiency');

        if (titleEl) titleEl.textContent = type === 'success' ? 'Gratulacje!' : 'Koniec Gry!';
        if (endGameMessage) endGameMessage.textContent = message;

        // Wyświetl procentowy P/L
        if (percentagePlEl) {
            percentagePlEl.textContent = `Zrobiłeś ${totalPlPercent >= 0 ? '+' : ''}${totalPlPercent.toFixed(2)}%`;
            percentagePlEl.className = totalPlPercent >= 0 ? 'positive' : 'negative';
        }

        // Wyświetl skuteczność
        if (efficiencyEl) {
            efficiencyEl.innerHTML = `Twoja skuteczność to <span class="trade-count">${gameState.profitableTrades}/${gameState.totalTrades}</span> zyskownych zagrań.<br>(${efficiencyPercent.toFixed(2)}% skuteczności)`;
            if (efficiencyPercent <= 10) {
                efficiencyEl.className = 'efficiency-low';
            } else if (efficiencyPercent <= 50) {
                efficiencyEl.className = 'efficiency-medium';
            } else {
                efficiencyEl.className = 'efficiency-high';
            }
        }

        // Usuń klasę hidden i dodaj show
        endGameModal.classList.remove('hidden');
        endGameModal.classList.add('show');
        
        // Dodatkowe sprawdzenie display style
        endGameModal.style.display = 'flex';
        
        const modalContent = endGameModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('success', 'error', 'info');
            modalContent.classList.add(type);
        }
        
        console.log('Modal końca gry powinien być widoczny');
    }

    function resetAndStartGame() {
        stopAutoTimer();
        resetGameState();
        // Ponownie załaduj ustawienia wskaźników po reset
        loadGameSettings();
        updateUI();
        updatePositionInfo();
        
        // W wersji mobilnej, zachowaj obecną pozycję wykresu jeśli gra już się rozpoczęła
        if (document.body.classList.contains('mobile') && gameStarted && chart) {
            // Zachowaj obecny zakres wykresu
            const currentRange = chart.timeScale().getVisibleRange();
            loadData();
            // Przywróć zakres po załadowaniu danych
            setTimeout(() => {
                if (currentRange && chart) {
                    chart.timeScale().setVisibleRange(currentRange);
                }
            }, 100);
        } else {
            loadData();
        }
    }

    // --- FUNKCJE TABELI WYNIKÓW ---
    function saveScore(playerName, score) {
        try {
            const scores = getLeaderboard();
            const newScore = {
                name: playerName.trim(),
                balance: score.balance,
                plPercent: score.plPercent,
                efficiency: score.efficiency,
                totalTrades: score.totalTrades,
                profitableTrades: score.profitableTrades,
                date: new Date().toLocaleDateString('pl-PL'),
                timestamp: Date.now()
            };
            
            scores.push(newScore);
            localStorage.setItem('buybit-leaderboard', JSON.stringify(scores));
            showNotification(`Wynik zapisany jako ${playerName}!`, 'success');
            return true;
        } catch (error) {
            console.error('Błąd zapisywania wyniku:', error);
            showNotification('Błąd przy zapisywaniu wyniku!', 'error');
            return false;
        }
    }

    function getLeaderboard() {
        try {
            const saved = localStorage.getItem('buybit-leaderboard');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Błąd ładowania tabeli wyników:', error);
            return [];
        }
    }

    function clearLeaderboard() {
        if (confirm('Czy na pewno chcesz wyczyścić całą tabelę wyników?')) {
            localStorage.removeItem('buybit-leaderboard');
            renderLeaderboard();
            showNotification('Tabela wyników została wyczyszczona!', 'info');
        }
    }

    function sortLeaderboard(scores, sortBy) {
        return scores.sort((a, b) => {
            switch (sortBy) {
                case 'balance':
                    return b.balance - a.balance;
                case 'percent':
                    return b.plPercent - a.plPercent;
                case 'efficiency':
                    return b.efficiency - a.efficiency;
                default:
                    return b.timestamp - a.timestamp;
            }
        });
    }

    function renderLeaderboard() {
        const scores = getLeaderboard();
        
        if (scores.length === 0) {
            leaderboardContent.innerHTML = `
                <div class="leaderboard-empty">
                    <p>Brak wyników do wyświetlenia.</p>
                    <p>Zagraj w grę i zapisz swój wynik!</p>
                </div>
            `;
            return;
        }

        const sortedScores = sortLeaderboard(scores, 'balance');
        
        let tableHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Miejsce</th>
                        <th>Imię</th>
                        <th>Saldo końcowe</th>
                        <th>Zysk/Strata</th>
                        <th>Skuteczność</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedScores.forEach((score, index) => {
            const rank = index + 1;
            const medalHTML = rank <= 3 ? getMedalHTML(rank) : rank;
            const plClass = score.plPercent >= 0 ? 'positive' : 'negative';
            const efficiencyClass = score.efficiency >= 50 ? 'positive' : score.efficiency >= 30 ? 'neutral' : 'negative';
            
            tableHTML += `
                <tr>
                    <td class="rank">${medalHTML}</td>
                    <td class="name">${score.name}</td>
                    <td>${formatNumber(score.balance)}</td>
                    <td class="${plClass}">${score.plPercent >= 0 ? '+' : ''}${score.plPercent.toFixed(2)}%</td>
                    <td class="${efficiencyClass}">${score.profitableTrades}/${score.totalTrades} (${score.efficiency.toFixed(1)}%)</td>
                    <td>${score.date}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        leaderboardContent.innerHTML = tableHTML;
    }

    function getMedalHTML(rank) {
        const medals = {
            1: '<span class="rank-medal gold">🥇</span>1',
            2: '<span class="rank-medal silver">🥈</span>2',
            3: '<span class="rank-medal bronze">🥉</span>3'
        };
        return medals[rank] || rank;
    }

    function showSaveScoreModal() {
        if (!currentGameResult) return;
        
        // Wypełnij podsumowanie wyniku
        finalScoreEl.textContent = formatNumber(currentGameResult.balance);
        finalPlEl.textContent = `${currentGameResult.plPercent >= 0 ? '+' : ''}${currentGameResult.plPercent.toFixed(2)}%`;
        finalPlEl.className = currentGameResult.plPercent >= 0 ? 'positive' : 'negative';
        finalEfficiencyEl.textContent = `${currentGameResult.profitableTrades}/${currentGameResult.totalTrades} (${currentGameResult.efficiency.toFixed(1)}%)`;
        
        // Wyczyść pole imienia
        playerNameInput.value = '';
        
        // Pokaż modal
        saveScoreModal.classList.remove('hidden');
        saveScoreModal.classList.add('show');
        
        // Fokus na pole imienia
        setTimeout(() => playerNameInput.focus(), 100);
    }

    function hideSaveScoreModal() {
        saveScoreModal.classList.remove('show');
        saveScoreModal.classList.add('hidden');
    }

    function showLeaderboardModal() {
        renderLeaderboard();
        leaderboardModal.classList.remove('hidden');
        leaderboardModal.classList.add('show');
    }

    function hideLeaderboardModal() {
        leaderboardModal.classList.remove('show');
        leaderboardModal.classList.add('hidden');
    }

    function showContact() {
        const contactModal = document.getElementById('contact-modal');
        contactModal.classList.remove('hidden');
        contactModal.classList.add('show');
        contactModal.style.display = 'flex';
    }

    function hideContact() {
        const contactModal = document.getElementById('contact-modal');
        contactModal.classList.remove('show');
        contactModal.classList.add('hidden');
        contactModal.style.display = 'none';
    }

    // Usunięto funkcję updateSortButtons - nie jest już potrzebna

    function handleMarginChange() {
        gameState.marginMode = this.value;
        console.log(`Tryb marży zmieniony na: ${gameState.marginMode}`);
        saveAllSettings();
    }

    function syncAmountControls(source) {
        if (source === 'slider') {
            amountInput.value = amountSlider.value;
            if (amountMobileInput) amountMobileInput.value = amountSlider.value;
            if (amountMobileSlider) amountMobileSlider.value = amountSlider.value;
        } else {
            amountSlider.value = amountInput.value;
            if (amountMobileInput) amountMobileInput.value = amountInput.value;
            if (amountMobileSlider) amountMobileSlider.value = amountInput.value;
            updateSliderFill(amountSlider);
            if (amountMobileSlider) updateSliderFill(amountMobileSlider);
        }
    }

    function syncAmountControlsMobile(source) {
        if (source === 'slider') {
            if (amountMobileInput) amountMobileInput.value = amountMobileSlider.value;
            amountInput.value = amountMobileSlider.value;
            amountSlider.value = amountMobileSlider.value;
        } else {
            if (amountMobileSlider) amountMobileSlider.value = amountMobileInput.value;
            amountInput.value = amountMobileInput.value;
            amountSlider.value = amountMobileInput.value;
            if (amountMobileSlider) updateSliderFill(amountMobileSlider);
            updateSliderFill(amountSlider);
        }
    }

    function syncLeverageControls() {
        const leverageValue = leverageInput.value;
        if (leverageMobileInput) leverageMobileInput.value = leverageValue;
        if (leverageValueEl) leverageValueEl.textContent = `${leverageValue}x`;
        if (leverageMobileValueEl) leverageMobileValueEl.textContent = `${leverageValue}x`;
        updateSliderFill(leverageInput);
        if (leverageMobileInput) updateSliderFill(leverageMobileInput);
    }

    function syncLeverageControlsMobile() {
        const leverageValue = leverageMobileInput.value;
        leverageInput.value = leverageValue;
        if (leverageValueEl) leverageValueEl.textContent = `${leverageValue}x`;
        if (leverageMobileValueEl) leverageMobileValueEl.textContent = `${leverageValue}x`;
        updateSliderFill(leverageInput);
        updateSliderFill(leverageMobileInput);
    }

    function syncAssetSelection() {
        const assetValue = assetSelect.value;
        if (assetMobileSelect) assetMobileSelect.value = assetValue;
    }

    function syncAssetSelectionMobile() {
        const assetValue = assetMobileSelect.value;
        assetSelect.value = assetValue;
    }

    function syncIntervalSelection() {
        const intervalValue = intervalSelect.value;
        if (intervalMobileSelect) intervalMobileSelect.value = intervalValue;
    }

    function syncIntervalSelectionMobile() {
        const intervalValue = intervalMobileSelect.value;
        intervalSelect.value = intervalValue;
    }

    // --- PODPIĘCIE EVENTÓW I START ---
    assetSelect.addEventListener('change', () => {
        saveAllSettings();
        resetAndStartGame();
    });
    intervalSelect.addEventListener('change', () => {
        saveAllSettings();
        resetAndStartGame();
        showNotification('Gra zrestartowana!', 'info');
    });
    leverageInput.addEventListener('input', () => { syncLeverageControls(); });
    amountSlider.addEventListener('input', () => { syncAmountControls('slider'); updateSliderFill(amountSlider); });
    amountInput.addEventListener('input', () => { syncAmountControls('input'); updateSliderFill(amountSlider); });
    longBtn.addEventListener('click', () => openPosition('long'));
    shortBtn.addEventListener('click', () => openPosition('short'));
    closeBtn.addEventListener('click', closePosition);
    nextCandleBtn.addEventListener('click', showNextCandle);
    marginModeInputs.forEach(input => input.addEventListener('change', handleMarginChange));
    assetSelect.addEventListener('change', syncAssetSelection);
    intervalSelect.addEventListener('change', syncIntervalSelection);

    // Event listenery dla elementów mobilnych
    if (leverageMobileInput) {
        leverageMobileInput.addEventListener('input', () => { syncLeverageControlsMobile(); });
    }
    if (amountMobileSlider) {
        amountMobileSlider.addEventListener('input', () => { syncAmountControlsMobile('slider'); updateSliderFill(amountMobileSlider); });
    }
    if (amountMobileInput) {
        amountMobileInput.addEventListener('input', () => { syncAmountControlsMobile('input'); updateSliderFill(amountMobileSlider); });
    }
    if (longMobileBtn) {
        longMobileBtn.addEventListener('click', () => openPosition('long'));
    }
    if (shortMobileBtn) {
        shortMobileBtn.addEventListener('click', () => openPosition('short'));
    }
    if (closeMobileBtn) {
        closeMobileBtn.addEventListener('click', closePosition);
    }
    if (nextCandleMobileBtn) {
        nextCandleMobileBtn.addEventListener('click', showNextCandle);
    }
    if (marginModeMobileInputs) {
        marginModeMobileInputs.forEach(input => input.addEventListener('change', handleMarginChange));
    }
    if (assetMobileSelect) {
        assetMobileSelect.addEventListener('change', () => {
            syncAssetSelectionMobile();
            saveAllSettings();
            resetAndStartGame();
        });
    }
    if (intervalMobileSelect) {
        intervalMobileSelect.addEventListener('change', () => {
            syncIntervalSelectionMobile();
            saveAllSettings();
            resetAndStartGame();
            showNotification('Gra zrestartowana!', 'info');
        });
    }

    toggleRsiBtn.addEventListener('click', () => {
        gameState.showRSI = !gameState.showRSI;
        toggleRsiBtn.classList.toggle('active', gameState.showRSI);
        updateIndicators();
        saveAllSettings();
    });

    toggleMacdBtn.addEventListener('click', () => {
        gameState.showMACD = !gameState.showMACD;
        toggleMacdBtn.classList.toggle('active', gameState.showMACD);
        updateIndicators();
        saveAllSettings();
    });

    toggleBbBtn.addEventListener('click', () => {
        gameState.showBB = !gameState.showBB;
        toggleBbBtn.classList.toggle('active', gameState.showBB);
        updateIndicators();
        saveAllSettings();
    });

    toggleEmaBtn.addEventListener('click', () => {
        gameState.showEMA = !gameState.showEMA;
        toggleEmaBtn.classList.toggle('active', gameState.showEMA);
        updateIndicators();
        saveAllSettings();
    });

    toggleTmaBtn.addEventListener('click', () => {
        gameState.showTMA = !gameState.showTMA;
        toggleTmaBtn.classList.toggle('active', gameState.showTMA);
        updateIndicators();
        saveAllSettings();
    });

    // Event listenery dla przycisków wskaźników mobilnych
    if (toggleRsiMobileBtn) {
        toggleRsiMobileBtn.addEventListener('click', () => {
            gameState.showRSI = !gameState.showRSI;
            toggleRsiBtn.classList.toggle('active', gameState.showRSI);
            toggleRsiMobileBtn.classList.toggle('active', gameState.showRSI);
            updateIndicators();
            saveAllSettings();
        });
    }

    if (toggleMacdMobileBtn) {
        toggleMacdMobileBtn.addEventListener('click', () => {
            gameState.showMACD = !gameState.showMACD;
            toggleMacdBtn.classList.toggle('active', gameState.showMACD);
            toggleMacdMobileBtn.classList.toggle('active', gameState.showMACD);
            updateIndicators();
            saveAllSettings();
        });
    }

    if (toggleBbMobileBtn) {
        toggleBbMobileBtn.addEventListener('click', () => {
            gameState.showBB = !gameState.showBB;
            toggleBbBtn.classList.toggle('active', gameState.showBB);
            toggleBbMobileBtn.classList.toggle('active', gameState.showBB);
            updateIndicators();
            saveAllSettings();
        });
    }

    if (toggleEmaMobileBtn) {
        toggleEmaMobileBtn.addEventListener('click', () => {
            gameState.showEMA = !gameState.showEMA;
            toggleEmaBtn.classList.toggle('active', gameState.showEMA);
            toggleEmaMobileBtn.classList.toggle('active', gameState.showEMA);
            updateIndicators();
            saveAllSettings();
        });
    }

    if (toggleTmaMobileBtn) {
        toggleTmaMobileBtn.addEventListener('click', () => {
            gameState.showTMA = !gameState.showTMA;
            toggleTmaBtn.classList.toggle('active', gameState.showTMA);
            toggleTmaMobileBtn.classList.toggle('active', gameState.showTMA);
            updateIndicators();
            saveAllSettings();
        });
    }

    document.addEventListener('keydown', (event) => {
        // Pomiń skróty klawiszowe na urządzeniach mobilnych
        if (document.body.classList.contains('mobile')) {
            return;
        }
        
        // Zablokuj klawisz 'N' jeśli modal zakończenia gry jest widoczny
        if (endGameModal.classList.contains('show')) {
            return;
        }

        if (event.key === 'n' || event.key === 'N') {
            if (!nextCandleBtn.disabled) {
                showNextCandle();
            }
        }
    });

    endGameOkBtn.addEventListener('click', () => {
        endGameModal.classList.remove('show');
        endGameModal.classList.add('hidden');
        endGameModal.style.display = 'none';
        gameStarted = false;
        showWelcomeModal();
    });

    // Event listenery dla welcome modal
    if (welcomeRulesBtn) {
        welcomeRulesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideWelcomeModal();
            showGameRulesModal();
        });
    }
    
    if (welcomeStartBtn) {
        welcomeStartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startGameFromWelcome();
        });
    }

    // Sprawdź czy elementy istnieją
    console.log('gameRulesBtn:', gameRulesBtn);
    console.log('gameRulesModal:', gameRulesModal);
    
    // Event listenery dla modala z zasadami gry
    if (gameRulesBtn) {
        gameRulesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Przycisk Zasady gry kliknięty');
            showGameRulesModal();
        });
    } else {
        console.error('gameRulesBtn nie został znaleziony!');
    }
    if (gameRulesCancelBtn) {
        gameRulesCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideGameRulesModal();
        });
    }
    if (gameRulesApplyBtn) {
        gameRulesApplyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            applyGameSettings();
        });
    }
    
    // Obsługa checkboxa automatycznych świec
    autoCandlesCheckbox.addEventListener('change', function() {
        if (this.checked) {
            autoSpeedGroup.classList.add('enabled');
        } else {
            autoSpeedGroup.classList.remove('enabled');
        }
    });
    
    // Obsługa suwaka szybkości
    autoSpeedSlider.addEventListener('input', function() {
        autoSpeedValue.textContent = this.value + 's';
    });

    // Event listenery dla tabeli wyników
    if (saveScoreBtn) {
        saveScoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSaveScoreModal();
        });
    }

    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showLeaderboardModal();
        });
    }

    // Event listener dla przycisku kontakt
    const contactBtn = document.getElementById('contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showContact();
        });
    }

    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const playerName = playerNameInput.value.trim();
            if (playerName.length === 0) {
                showNotification('Wprowadź swoje imię!', 'error');
                return;
            }
            if (playerName.length > 20) {
                showNotification('Imię może mieć maksymalnie 20 znaków!', 'error');
                return;
            }
            
            if (saveScore(playerName, currentGameResult)) {
                hideSaveScoreModal();
                currentGameResult = null;
            }
        });
    }

    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideSaveScoreModal();
        });
    }

    if (closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideLeaderboardModal();
        });
    }

    // Event listener dla przycisku zamknij w modalu kontakt
    const closeContactBtn = document.getElementById('close-contact-btn');
    if (closeContactBtn) {
        closeContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideContact();
        });
    }

    // Usunięto event listenery dla przycisków sortowania - zawsze sortowanie po saldzie

    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearLeaderboard();
        });
    }

    // Obsługa Enter w polu imienia
    if (playerNameInput) {
        playerNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                confirmSaveBtn.click();
            }
        });
    }

    // Obsługa kopiowania adresu ETH i email
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('eth-address')) {
            const address = e.target.textContent;
            navigator.clipboard.writeText(address).then(() => {
                showNotification('Adres ETH skopiowany do schowka!', 'success');
            }).catch(() => {
                // Fallback dla starszych przeglądarek
                const textArea = document.createElement('textarea');
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Adres ETH skopiowany do schowka!', 'success');
            });
        }
        
        if (e.target.classList.contains('email-address')) {
            const email = e.target.textContent;
            navigator.clipboard.writeText(email).then(() => {
                showNotification('Email skopiowany do schowka!', 'success');
            }).catch(() => {
                // Fallback dla starszych przeglądarek
                const textArea = document.createElement('textarea');
                textArea.value = email;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Email skopiowany do schowka!', 'success');
            });
        }
    });

    // Funkcja inicjalizacji elementów mobilnych
    function initializeMobileElements() {
        // Synchronizuj początkowe wartości z elementami mobilnymi
        if (assetMobileSelect && assetSelect) {
            assetMobileSelect.value = assetSelect.value;
        }
        if (intervalMobileSelect && intervalSelect) {
            intervalMobileSelect.value = intervalSelect.value;
        }
        if (amountMobileInput && amountInput) {
            amountMobileInput.value = amountInput.value;
        }
        if (amountMobileSlider && amountSlider) {
            amountMobileSlider.value = amountSlider.value;
            amountMobileSlider.max = amountSlider.max;
        }
        if (leverageMobileInput && leverageInput) {
            leverageMobileInput.value = leverageInput.value;
        }
        
        // Synchronizuj stan przycisków margin mode
        const checkedDesktop = document.querySelector('input[name="margin-mode"]:checked');
        if (checkedDesktop && marginModeMobileInputs) {
            marginModeMobileInputs.forEach(input => {
                if (input.value === checkedDesktop.value) {
                    input.checked = true;
                }
            });
        }
    }

    // Funkcja inicjalizacji
    function initializeGame() {
        // Wykryj urządzenia mobilne
        if (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.body.classList.add('mobile');
            console.log('Wykryto urządzenie mobilne');
        }
        
        // Załaduj zapisane ustawienia
        const settingsLoaded = loadGameSettings();
        
        // Inicjalizuj elementy mobilne po załadowaniu ustawień
        if (document.body.classList.contains('mobile')) {
            initializeMobileElements();
        }
        
        // Ustaw początkowe stany modali
        if (gameRulesModal) {
            gameRulesModal.classList.add('hidden');
        }
        if (endGameModal) {
            endGameModal.classList.add('hidden');
        }
        if (welcomeModal) {
            welcomeModal.classList.add('hidden');
        }
        if (saveScoreModal) {
            saveScoreModal.classList.add('hidden');
        }
        if (leaderboardModal) {
            leaderboardModal.classList.add('hidden');
        }
        
        const contactModal = document.getElementById('contact-modal');
        if (contactModal) {
            contactModal.classList.add('hidden');
        }
        
        // Jeśli załadowano ustawienia, zastosuj je do UI
        if (settingsLoaded) {
            console.log('Zastosowuję załadowane ustawienia do UI');
            // Odśwież stan marży
            const savedSettings = JSON.parse(localStorage.getItem('buybit-game-settings') || '{}');
            if (savedSettings.marginMode) {
                gameState.marginMode = savedSettings.marginMode;
            }
        }
        
        // Pokaż welcome modal zamiast od razu rozpoczynać grę
        showWelcomeModal();
    }
    
    // Uruchom po krótkim opóźnieniu aby upewnić się że DOM jest gotowy
    setTimeout(initializeGame, 100);
});
