export const createSmartHomeTemplate = () => {
    return {
        name: 'Smart Home & Building IoT',
        category: 'Shop Floor',
        config: {
            steps: [
                {
                    id: 'screen_1',
                    title: 'Building Automation Dashboard',
                    description: 'Monitor HVAC, lighting, and environmental sensors in real-time.',
                    components: [
                        {
                            id: 'lbl_title',
                            name: 'Header_Title',
                            type: 'LABEL',
                            x: 40,
                            y: 30,
                            w: 400,
                            h: 50,
                            props: {
                                text: 'Building Automation & IoT',
                                fontSize: 24,
                                fontColor: '#1e293b',
                                isBold: true
                            }
                        }
                    ]
                }
            ],
            baseComponents: [],
            appTriggers: [],
            appVariables: [
                { id: 'v_temp', name: 'Room_Temperature', type: 'NUMBER', value: 24.5 },
                { id: 'v_humidity', name: 'Room_Humidity', type: 'NUMBER', value: 55 }
            ],
            devicePreset: 'RESPONSIVE',
            previewDevice: 'RESPONSIVE',
            previewOrientation: 'PORTRAIT',
            scalingMode: 'FIT_SCREEN'
        }
    };
};
