import { useState } from 'react';

export default function useAppBuilderHistory({
    steps, setSteps,
    baseComponents, setBaseComponents,
    appTriggers, setAppTriggers,
    appVariables, setAppVariables,
    appName, setAppName
}) {
    // --- System 1: builderStack (undo/redo) ---
    const [builderStack, setBuilderStack] = useState({ undo: [], redo: [] });
    const [preCopilotSnapshot, setPreCopilotSnapshot] = useState(null);

    const saveToHistory = () => {
        const state = {
            baseComponents: JSON.parse(JSON.stringify(baseComponents)),
            steps: JSON.parse(JSON.stringify(steps)),
            appTriggers: JSON.parse(JSON.stringify(appTriggers)),
            appVariables: JSON.parse(JSON.stringify(appVariables)),
            appName: appName
        };
        setBuilderStack(prev => ({
            undo: [state, ...prev.undo].slice(0, 50),
            redo: []
        }));
    };

    const undo = () => {
        if (builderStack.undo.length === 0) return;
        const currentState = {
            baseComponents: JSON.parse(JSON.stringify(baseComponents)),
            steps: JSON.parse(JSON.stringify(steps)),
            appTriggers: JSON.parse(JSON.stringify(appTriggers)),
            appVariables: JSON.parse(JSON.stringify(appVariables)),
            appName: appName
        };
        const prevState = builderStack.undo[0];

        setBaseComponents(prevState.baseComponents);
        setSteps(prevState.steps);
        setAppTriggers(prevState.appTriggers);
        setAppVariables(prevState.appVariables);
        setAppName(prevState.appName);

        setBuilderStack(prev => ({
            undo: prev.undo.slice(1),
            redo: [currentState, ...prev.redo]
        }));
    };

    const redo = () => {
        if (builderStack.redo.length === 0) return;
        const currentState = {
            baseComponents: JSON.parse(JSON.stringify(baseComponents)),
            steps: JSON.parse(JSON.stringify(steps)),
            appTriggers: JSON.parse(JSON.stringify(appTriggers)),
            appVariables: JSON.parse(JSON.stringify(appVariables)),
            appName: appName
        };
        const nextState = builderStack.redo[0];

        setBaseComponents(nextState.baseComponents);
        setSteps(nextState.steps);
        setAppTriggers(nextState.appTriggers);
        setAppVariables(nextState.appVariables);
        setAppName(nextState.appName);

        setBuilderStack(prev => ({
            undo: [currentState, ...prev.undo],
            redo: prev.redo.slice(1)
        }));
    };

    // --- System 2: history/future arrays ---
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);

    const saveHistory = () => {
        const currentState = {
            steps: JSON.parse(JSON.stringify(steps)),
            baseComponents: JSON.parse(JSON.stringify(baseComponents))
        };
        setHistory(prev => [...prev, currentState].slice(-50)); // Keep last 50 steps
        setFuture([]);
    };

    const handleHistorySnapshot = (newSteps, newBase) => {
        saveHistory();
        saveToHistory();
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const currentState = {
            steps: JSON.parse(JSON.stringify(steps)),
            baseComponents: JSON.parse(JSON.stringify(baseComponents))
        };
        setFuture(prev => [currentState, ...prev].slice(0, 50));
        setSteps(previousState.steps);
        setBaseComponents(previousState.baseComponents);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const nextState = future[0];
        const currentState = {
            steps: JSON.parse(JSON.stringify(steps)),
            baseComponents: JSON.parse(JSON.stringify(baseComponents))
        };
        setHistory(prev => [...prev, currentState].slice(-50));
        setSteps(nextState.steps);
        setBaseComponents(nextState.baseComponents);
        setFuture(prev => prev.slice(1));
    };

    return {
        builderStack, setBuilderStack,
        preCopilotSnapshot, setPreCopilotSnapshot,
        saveToHistory,
        undo,
        redo,
        history, setHistory,
        future, setFuture,
        saveHistory,
        handleHistorySnapshot,
        handleUndo,
        handleRedo
    };
}
