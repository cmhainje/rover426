import {
	BackSide,
	BoxGeometry,
	Mesh,
	ShaderMaterial,
	UniformsUtils,
	Vector3
} from '../build/three.module.js';
import * as jquery from '../build/jquery-3.6.0.js'

/**
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard analytic skydome model
 * https://www.researchgate.net/publication/220720443_A_Practical_Analytic_Model_for_Daylight
 *
 * First implemented by Simon Wallner
 * http://www.simonwallner.at/projects/atmospheric-scattering
 *
 * Improved by Martin Upitis
 * http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
 *
 * Three.js integration by zz85 http://twitter.com/blurspline
*/

class Sky extends Mesh {

	constructor() {
		const shader = Sky.SkyShader;
		$.ajax({url: '../shaders/sky.frag', async: false}).done(data => { shader.fragmentShader = data; });
		$.ajax({url: '../shaders/sky.vert', async: false}).done(data => { shader.vertexShader = data; });

		const material = new ShaderMaterial( {
			name: 'SkyShader',
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: UniformsUtils.clone( shader.uniforms ),
			side: BackSide,
			depthWrite: false
		} );

		super( new BoxGeometry( 1, 1, 1 ), material );
	}
}

Sky.prototype.isSky = true;

Sky.SkyShader = {
	uniforms: {
		'turbidity': { value: 2 },
		'rayleigh': { value: 1 },
		'mieCoefficient': { value: 0.005 },
		'mieDirectionalG': { value: 0.8 },
		'sunPosition': { value: new Vector3() },
		'up': { value: new Vector3( 0, 1, 0 ) }
	},
	fragmentShader: undefined,
	vertexShader: undefined
};

export { Sky };
