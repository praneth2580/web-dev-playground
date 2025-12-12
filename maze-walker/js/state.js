function useState(initialValue, renderer) {
    let timer = null;

    function scheduleRender(value) {
        // Debounce renders to batch multiple updates (like in .push)
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            renderer(value);
            timer = null;
        }, 0);
    }

    function makeReactive(value) {
        if (typeof value === "object" && value !== null) {
            return new Proxy(value, {
                set(target, prop, newValue) {
                    target[prop] = newValue;
                    if (prop !== "length") scheduleRender(target);
                    return true;
                },
                deleteProperty(target, prop) {
                    delete target[prop];
                    scheduleRender(target);
                    return true;
                },
            });
        }
        return value;
    }

    const state = { value: makeReactive(initialValue) };

    return new Proxy(state, {
        get(target, prop) {
            return target[prop];
        },
        set(target, prop, newValue) {
            if (prop === "value" && target.value !== newValue) {
                target.value = makeReactive(newValue);
                scheduleRender(target.value);
            }
            return true;
        },
    });
}


const totalTime = useState(0, (val) => {
    totalTimeEle.innerText = val;
});
const noOfTurns = useState(0, (val) => {
    noOfTurnsEle.innerText = val;
});
const noOfBacktracks = useState(0, (val) => {
    noOfBacktracksEle.innerText = val;
});
const score = useState(0, (val) => {
    scoreEle.innerText = `${val}/10`;
});
const history = useState([], (val) => {
    addHistory(history.value[history.value.length - 1], history.value.length);
});
const moves = useState([], (val) => {
    updateMove(val[val.length - 1][0], val[val.length - 1][1]);
});

let moveInterval = null;


// setInterval(() => history.value.push({
//     direction: 'top',
//     type: 'forward',
//     time: 1
// }), 2000)