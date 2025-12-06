import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useHistory } from '@docusaurus/router';
import * as THREE from 'three';

// --- 1. 数据配置：新增哈希、贪心、回溯 ---
const PLANETS = [
  // 基础 (内圈)
  { id: 'array', title: '数组', path: '/docs/demo', type: 'rocky', color: '#00f2ff', radius: 14, speed: 0.6, size: 1.8 },
  { id: 'linkedlist', title: '链表', path: '/docs/list/intro', type: 'rocky', color: '#00c3ff', radius: 19, speed: 0.5, size: 2.0 },

  // 核心数据结构 (中圈)
  { id: 'stack', title: '栈', path: '/docs/stack/intro', type: 'gas', color: '#ff0055', radius: 26, speed: 0.4, size: 2.8 },
  { id: 'queue', title: '队列', path: '/docs/queue/intro', type: 'gas', color: '#ff9900', radius: 34, speed: 0.35, size: 3.0 },
  { id: 'hash', title: '哈希表', path: '/docs/hash/intro', type: 'gas', color: '#b000b5', radius: 42, speed: 0.3, size: 3.2 }, // 新增

  // 复杂结构 (外圈)
  { id: 'tree', title: '树/二叉树', path: '/docs/tree/intro', type: 'earth', color: '#00ff66', radius: 52, speed: 0.25, size: 3.5 },
  { id: 'graph', title: '图论', path: '/docs/graph/intro', type: 'gas', color: '#bd00ff', radius: 64, speed: 0.2, size: 4.0 },

  // 核心算法 (边缘圈)
  { id: 'search', title: '查找', path: '/docs/search/intro', type: 'ring', color: '#ffe600', radius: 78, speed: 0.15, size: 3.2 },
  { id: 'sort', title: '排序', path: '/docs/sort/intro', type: 'gas', color: '#ff3366', radius: 90, speed: 0.12, size: 3.8 },
  { id: 'greedy', title: '贪心', path: '/docs/greedy/intro', type: 'rocky', color: '#ffd700', radius: 102, speed: 0.1, size: 3.0 }, // 新增
  { id: 'backtrack', title: '回溯', path: '/docs/backtrack/intro', type: 'ring', color: '#ff4d4d', radius: 115, speed: 0.08, size: 3.6 }, // 新增
  { id: 'string', title: '字符串', path: '/docs/string/intro', type: 'ring', color: '#ffffff', radius: 130, speed: 0.06, size: 3.5 },
];

// --- 2. 原生粒子爆炸 ---
const NativeExplosion = ({ color, onComplete }) => {
  const count = 400;
  const pointsRef = useRef();

  const [data] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 5;
      positions[i*3+1] = (Math.random() - 0.5) * 5;
      positions[i*3+2] = (Math.random() - 0.5) * 5;
      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 1.5
      });
    }
    return { positions, velocities };
  });

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i*3] += data.velocities[i].x;
      posAttr.array[i*3+1] += data.velocities[i].y;
      posAttr.array[i*3+2] += data.velocities[i].z;
    }
    posAttr.needsUpdate = true;
    pointsRef.current.material.opacity -= 0.025;
    if (pointsRef.current.material.opacity <= 0) onComplete && onComplete();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attachObject={['attributes', 'position']} count={count} array={data.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={1.2} color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// --- 3. 行星外观组件 ---
const RockyVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} flatShading={true} />
    </mesh>
    <mesh scale={[1.05, 1.05, 1.05]}>
      <icosahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
    </mesh>
  </group>
);

const GasVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <sphereGeometry args={[size * 0.8, 32, 32]} />
      <meshBasicMaterial color={color} />
    </mesh>
    <Sphere args={[size, 32, 32]}>
      <MeshDistortMaterial
        color={color} speed={2} distort={0.2} radius={1}
        transparent opacity={0.6} roughness={0} metalness={0.5}
      />
    </Sphere>
    <mesh scale={[1.4, 1.4, 1.4]}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>
);

const RingVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[size * 1.4, size * 2.0, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[size * 2.1, size * 2.15, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const EarthVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 4]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
    </mesh>
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
    </mesh>
  </group>
);

// --- 4. 行星逻辑 ---
const Planet = ({ data, history }) => {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHover] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  useFrame((state, delta) => {
    if (isExploding || !groupRef.current) return;
    if (!hovered) angleRef.current += delta * data.speed * 0.2;
    const x = Math.cos(angleRef.current) * data.radius;
    const z = Math.sin(angleRef.current) * data.radius;
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = 0.2;

    const targetScale = hovered ? 1.3 : 1.0;
    const cur = groupRef.current.scale.x;
    const next = THREE.MathUtils.lerp(cur, targetScale, 0.1);
    groupRef.current.scale.set(next, next, next);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setIsExploding(true);
    document.body.style.cursor = 'auto';
  };

  const renderVisuals = () => {
    switch(data.type) {
      case 'rocky': return <RockyVisuals color={data.color} size={data.size} />;
      case 'gas': return <GasVisuals color={data.color} size={data.size} />;
      case 'ring': return <RingVisuals color={data.color} size={data.size} />;
      case 'earth': return <EarthVisuals color={data.color} size={data.size} />;
      default: return <RockyVisuals color={data.color} size={data.size} />;
    }
  };

  return (
    <group>
      {!isExploding ? (
        <group ref={groupRef}>
          <group
            onClick={handleClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
          >
            {renderVisuals()}
            <Html distanceFactor={80} position={[0, data.size + 2, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{
                color: hovered ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: 'bold', fontSize: '14px',
                textShadow: `0 0 10px ${data.color}`,
                whiteSpace: 'nowrap', opacity: hovered ? 1 : 0.6,
                background: hovered ? 'rgba(0,0,0,0.6)' : 'transparent',
                padding: '2px 8px', borderRadius: '4px',
                transition: 'all 0.2s', letterSpacing: '1px', borderBottom: hovered ? `2px solid ${data.color}` : 'none'
              }}>
                {data.title}
              </div>
            </Html>
          </group>
        </group>
      ) : (
        <group position={groupRef.current?.position}>
          <NativeExplosion color={data.color} onComplete={() => history.push(data.path)} />
        </group>
      )}
      {!isExploding && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[data.radius - 0.1, data.radius + 0.1, 128]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
};

// --- 5. 核心太阳 (打字机效果) ---
const DataCoreSun = () => {
  const groupRef = useRef();
  const textRef = useRef();
  const [displayText, setDisplayText] = useState('');
  const fullText = "ALGORITHM";

  // 打字机效果
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(fullText.substring(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(timer);
    }, 200); // 200ms 打一个字
    return () => clearInterval(timer);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const baseScale = 0.4;
    const breathe = Math.sin(t * 1.5) * 0.02;
    const currentScale = baseScale + breathe;

    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (textRef.current) {
      textRef.current.style.transform = `scale(${currentScale})`;
    }
  });

  return (
    <group>
      <Sphere args={[7, 32, 32]}>
        <MeshDistortMaterial color="#ff6600" emissive="#ff2200" emissiveIntensity={2} speed={2} distort={0.2} />
      </Sphere>
      <group ref={groupRef}>
        <mesh scale={[1.2, 1.2, 1.2]}>
          <icosahedronGeometry args={[7, 1]} />
          <meshBasicMaterial color="#ffaa00" wireframe transparent opacity={0.15} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[10, 10.2, 64]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <pointLight distance={200} intensity={4} color="#ffaa00" />

      <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none', width: '600px', height: '200px' }} zIndexRange={[100, 0]}>
        <style>{`
          @keyframes text-flicker {
            0% { opacity: 1; } 3% { opacity: 0.5; } 6% { opacity: 1; } 7% { opacity: 0.5; } 8% { opacity: 1; } 9% { opacity: 1; } 100% { opacity: 1; }
          }
          @keyframes blink { 50% { opacity: 0; } }
          .holo-text { animation: text-flicker 4s infinite; }
          .cursor { display: inline-block; width: 10px; background: #00c3ff; animation: blink 1s step-end infinite; }
        `}</style>

        <div ref={textRef} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap',
            transform: 'scale(0.4)', transition: 'transform 0.1s linear',
          }}
        >
          <div className="holo-text" style={{
            fontSize: '24px', color: '#00f2ff', letterSpacing: '12px', marginBottom: '10px',
            textShadow: '0 0 10px rgba(0, 242, 255, 0.8)', borderBottom: '2px solid rgba(0, 242, 255, 0.5)',
            paddingBottom: '5px', width: '100%', textAlign: 'center'
          }}>
            XU'S
          </div>

          <div style={{
            fontSize: '80px', fontWeight: '900', letterSpacing: '8px', lineHeight: '1',
            background: 'linear-gradient(180deg, #ffffff 0%, #00c3ff 100%)', backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(0, 195, 255, 0.9))',
            display: 'flex', alignItems: 'baseline'
          }}>
            {displayText}
            <span className="cursor">_</span>
          </div>

          <div style={{
            fontSize: '20px', color: 'rgba(166, 247, 255, 0.7)', letterSpacing: '16px', marginTop: '15px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
            borderTop: '1px solid rgba(0, 242, 255, 0.3)', paddingTop: '10px'
          }}>
            <span style={{opacity:0.5}}>&lt;&lt;</span>
            <span style={{margin: '0 15px'}}>PLANET</span>
            <span style={{opacity:0.5}}>&gt;&gt;</span>
          </div>
        </div>
      </Html>
    </group>
  );
};

// --- 6. 背景装饰 ---
const Nebula = () => {
  const count = 5;
  const data = useMemo(() => new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 50, z: (Math.random() - 0.5) * 200,
      scale: 20 + Math.random() * 20, color: Math.random() > 0.5 ? '#2f54eb' : '#bd00ff'
    })), []);
  return (
    <group>
      {data.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.scale, 16, 16]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

const NativeStarField = () => {
  const count = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const r = 100 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
    }
    return pos;
  }, []);
  return (
    <points>
      <bufferGeometry><bufferAttribute attachObject={['attributes', 'position']} count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={1.2} color="#888888" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// --- 7. 主场景 ---
const SolarSystem3D = () => {
  const history = useHistory();
  return (
    <div style={{ width: '100%', height: '100vh', background: '#020204' }}>
      <Canvas camera={{ position: [0, 60, 90], fov: 55 }}>
        <ambientLight intensity={0.2} />
        <NativeStarField />
        <Nebula />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
          <planeGeometry args={[600, 600, 60, 60]} />
          <meshBasicMaterial color="#1a2b3c" wireframe transparent opacity={0.06} />
        </mesh>
        <DataCoreSun />
        {PLANETS.map((planet) => (
          <Planet key={planet.id} data={planet} history={history} />
        ))}
        <OrbitControls enablePan={false} enableZoom={true} maxDistance={250} minDistance={30} autoRotate={true} autoRotateSpeed={0.15} maxPolarAngle={Math.PI / 2} />
      </Canvas>
      <div style={{
        position: 'absolute', bottom: '50px', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10
      }}>
         <div style={{
           display: 'inline-block', color: '#00f3ff', fontFamily: '"Courier New", Courier, monospace',
           fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', border: '1px solid #00f3ff',
           padding: '12px 30px', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.7)',
           boxShadow: '0 0 15px rgba(0, 243, 255, 0.4), inset 0 0 10px rgba(0, 243, 255, 0.2)', textTransform: 'uppercase'
         }}>
            拖拽探索.点击进入
         </div>
      </div>
    </div>
  );
};

export default SolarSystem3D;