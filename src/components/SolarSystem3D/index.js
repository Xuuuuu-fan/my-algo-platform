/* --- START OF FILE text/javascript --- */

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useHistory } from '@docusaurus/router';
import * as THREE from 'three';

// --- 1. 数据配置 (保持你的数据结构) ---
const PLANETS = [
  // 基础
  { id: 'array', title: '数组', path: '/docs/array/intro', type: 'rocky', color: '#00f2ff', radius: 14, speed: 0.6, size: 1.8, keywords: 'array vector 连续内存' },
  { id: 'linkedlist', title: '线性表', path: '/docs/list/intro', type: 'rocky', color: '#00c3ff', radius: 19, speed: 0.5, size: 2.0, keywords: 'linked list 指针' },
  // 核心
  { id: 'stack', title: '栈', path: '/docs/stack/intro', type: 'gas', color: '#ff0055', radius: 26, speed: 0.4, size: 2.8, keywords: 'stack lifo' },
  { id: 'queue', title: '队列', path: '/docs/queue/intro', type: 'gas', color: '#ff9900', radius: 34, speed: 0.35, size: 3.0, keywords: 'queue fifo' },
  { id: 'hash', title: '哈希表', path: '/docs/hash/intro', type: 'gas', color: '#b000b5', radius: 42, speed: 0.3, size: 3.2 },
  // 复杂
  { id: 'tree', title: '树/二叉树', path: '/docs/tree/intro', type: 'earth', color: '#00ff66', radius: 52, speed: 0.25, size: 3.5, keywords: 'tree binary' },
  { id: 'graph', title: '图论', path: '/docs/graph/intro', type: 'gas', color: '#bd00ff', radius: 64, speed: 0.2, size: 4.0 },
  // 算法
  { id: 'search', title: '查找', path: '/docs/search/intro', type: 'ring', color: '#ffe600', radius: 78, speed: 0.15, size: 3.2 },
  { id: 'sort', title: '排序', path: '/docs/sort/intro', type: 'gas', color: '#ff3366', radius: 90, speed: 0.12, size: 3.8 },
  { id: 'greedy', title: '贪心', path: '/docs/greedy/intro', type: 'rocky', color: '#ffd700', radius: 102, speed: 0.1, size: 3.0 },
  { id: 'backtrack', title: '回溯', path: '/docs/backtrack/intro', type: 'ring', color: '#ff4d4d', radius: 115, speed: 0.08, size: 3.6 },
  { id: 'string', title: '字符串', path: '/docs/string/intro', type: 'ring', color: '#ffffff', radius: 130, speed: 0.06, size: 3.5, keywords: 'string kmp' },
];

// --- 2. 粒子爆炸 ---
const NativeExplosion = ({ color, onComplete }) => {
  const count = 400;
  const pointsRef = useRef();
  const [data] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      velocities.push({
        x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5
      });
    }
    return { positions, velocities };
  });

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += data.velocities[i].x;
      posAttr.array[i * 3 + 1] += data.velocities[i].y;
      posAttr.array[i * 3 + 2] += data.velocities[i].z;
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

// --- 3. 视觉组件 ---
const glowMaterialProps = (color, opacity = 0.5) => ({
  color: color,
  transparent: true,
  opacity: opacity,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide
});

const TargetLock = ({ color, size }) => {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * 2;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.5, size * 1.6, 32]} />
        <meshBasicMaterial {...glowMaterialProps(color, 0.8)} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.8, size * 1.85, 4, 1]} />
        <meshBasicMaterial {...glowMaterialProps(color, 0.4)} />
      </mesh>
    </group>
  );
};

const RockyVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} flatShading />
    </mesh>
    <mesh scale={[1.1, 1.1, 1.1]}>
      <icosahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} wireframe {...glowMaterialProps(color, 0.3)} />
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
      <MeshDistortMaterial color={color} speed={3} distort={0.3} radius={1} transparent opacity={0.6} roughness={0} />
    </Sphere>
    <mesh scale={[1.5, 1.5, 1.5]}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial color={color} {...glowMaterialProps(color, 0.15)} />
    </mesh>
  </group>
);

const RingVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
    </mesh>
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <ringGeometry args={[size * 1.4, size * 2.2, 64]} />
      <meshBasicMaterial color={color} {...glowMaterialProps(color, 0.4)} />
    </mesh>
  </group>
);

const EarthVisuals = ({ color, size }) => (
  <group>
    <mesh>
      <icosahedronGeometry args={[size, 4]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />
    </mesh>
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} wireframe {...glowMaterialProps(color, 0.2)} />
    </mesh>
    <mesh position={[size * 1.8, 0, 0]}>
      <sphereGeometry args={[size * 0.2, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  </group>
);

// --- 4. 行星逻辑 ---
const Planet = ({ data, history, isSearchMatch }) => {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHover] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const opacityFactor = isSearchMatch ? 1 : 0.1;

  useFrame((state, delta) => {
    if (isExploding || !groupRef.current) return;

    if (!hovered) {
        angleRef.current += delta * data.speed * 0.15;
    }

    const x = Math.cos(angleRef.current) * data.radius;
    const z = Math.sin(angleRef.current) * data.radius;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, x, 0.1);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, z, 0.1);

    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = 0.1;

    const targetScale = hovered ? 1.4 : (isSearchMatch ? 1.0 : 0.8);
    const cur = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(cur, targetScale, 0.1));
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
            {hovered && <TargetLock color={data.color} size={data.size} />}

            <Html distanceFactor={100} position={[0, data.size + 2.5, 0]} center style={{ pointerEvents: 'none', opacity: opacityFactor }}>
              <div style={{
                color: hovered ? '#fff' : data.color,
                fontWeight: '900', fontSize: '12px',
                fontFamily: "'Orbitron', sans-serif",
                textShadow: hovered ? `0 0 20px ${data.color}` : 'none',
                whiteSpace: 'nowrap',
                background: hovered ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)',
                padding: '4px 10px',
                border: `1px solid ${data.color}`,
                borderLeft: `4px solid ${data.color}`,
                transform: hovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)',
                clipPath: 'polygon(0 0, 100% 0, 100% 80%, 90% 100%, 0 100%)'
              }}>
                {data.title.toUpperCase()}
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
            <ringGeometry args={[data.radius - 0.15, data.radius + 0.15, 128]} />
            <meshBasicMaterial
                color={data.color}
                transparent
                opacity={hovered ? 0.6 : (isSearchMatch ? 0.2 : 0.05)}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
      )}
    </group>
  );
};

// --- 5. 核心太阳 (修改：增加打字机效果) ---
const DataCoreSun = () => {
  const groupRef = useRef();
  const [displayText, setDisplayText] = useState(''); // 1. 状态：当前显示的文字
  const fullText = "XU'S SPACE"; // 2. 目标文字

  // 3. 打字机 Effect
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
        setDisplayText((prev) => {
            if (i >= fullText.length) {
                clearInterval(timer);
                return fullText;
            }
            const nextChar = fullText.charAt(i);
            i++;
            return prev + nextChar;
        });
    }, 300); // 打字速度：150ms 一个字

    return () => clearInterval(timer);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.z = -t * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    }
  });

  return (
    <group>
      <Sphere args={[5.5, 32, 32]}>
        <MeshDistortMaterial color="#ff5500" emissive="#ff2200" emissiveIntensity={2} speed={3} distort={0.3} toneMapped={false} />
      </Sphere>

      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[5.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>

      <group ref={groupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[7.5, 7.6, 64]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, 0, 0]}>
            <ringGeometry args={[9, 9.2, 64]} />
            <meshBasicMaterial color="#ff0055" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <pointLight distance={100} intensity={2.5} color="#ff8800" decay={2} />

      <Html position={[0, 0, 0]} style={{ pointerEvents: 'none', width: '100%', height: '100%' }} zIndexRange={[100, 0]}>
        <div className="holo-container">
          <div className="holo-ring"></div>
          <div className="holo-content">
            {/* 4. 修改显示逻辑，增加光标 */}
            <h1 className="glitch-text" data-text={displayText}>
                {displayText}
                <span className="cursor">_</span>
            </h1>
            <div className="scan-line"></div>
            <p className="holo-sub">SYSTEM ONLINE</p>
          </div>
        </div>
      </Html>
    </group>
  );
};

// --- 6. 背景环境 ---
const EnhancedBackground = () => {
  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const [positions] = useState(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
        pos[i*3] = (Math.random() - 0.5) * 400;
        pos[i*3+1] = (Math.random() - 0.5) * 100;
        pos[i*3+2] = (Math.random() - 0.5) * 400;
    }
    return pos;
  });

  return (
    <group>
      <points>
        <bufferGeometry>
            <bufferAttribute attachObject={['attributes', 'position']} count={1500} array={new Float32Array(4500).map(() => (Math.random() - 0.5) * 800)} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={1.5} map={circleTexture} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points>
        <bufferGeometry>
            <bufferAttribute attachObject={['attributes', 'position']} count={400} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={3} map={circleTexture} color="#00f2ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
        <planeGeometry args={[600, 600, 40, 40]} />
        <meshBasicMaterial color="#00f2ff" wireframe transparent opacity={0.03} />
      </mesh>
    </group>
  );
};

// --- 7. 主入口 ---
const SolarSystem3D = () => {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');

  const { filteredPlanets, isFiltering } = useMemo(() => {
    if (!searchQuery) return { filteredPlanets: PLANETS, isFiltering: false };
    const lower = searchQuery.toLowerCase();
    const matches = PLANETS.filter(p =>
        p.title.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower) ||
        (p.keywords && p.keywords.toLowerCase().includes(lower))
    );
    return { filteredPlanets: matches, isFiltering: true };
  }, [searchQuery]);

  const checkMatch = (planetId) => {
      if (!isFiltering) return true;
      return filteredPlanets.some(p => p.id === planetId);
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#020204', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap');

        .holo-container {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            pointer-events: none;
        }
        .holo-content { position: relative; z-index: 2; text-align: center; }
        
        /* 5. 核心文字与光标样式 */
        .glitch-text {
            font-family: 'Orbitron', sans-serif; font-size: 40px; font-weight: 900; color: #fff;
            text-shadow: 0 0 10px rgba(0,242,255,0.8), 0 0 20px rgba(0,242,255,0.5);
            margin: 0; letter-spacing: 4px;
            white-space: nowrap; /* 防止换行 */
        }
        
        .cursor {
            display: inline-block;
            color: #00f2ff;
            animation: blink 1s step-end infinite;
            text-shadow: 0 0 10px #00f2ff;
            margin-left: 2px;
            vertical-align: bottom;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .holo-sub {
            font-family: 'Rajdhani', sans-serif; font-size: 14px; color: #00f2ff;
            letter-spacing: 6px; margin-top: 5px; opacity: 0.8;
        }
        
        .search-hud {
            position: absolute; top: 30px; right: 30px; z-index: 20;
            display: flex; flex-direction: column; align-items: flex-end;
        }
        .search-box-wrapper {
            position: relative;
            background: rgba(0, 10, 20, 0.6);
            border: 1px solid rgba(0, 242, 255, 0.3);
            border-left: 4px solid #00f2ff;
            padding: 10px 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
            clip-path: polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%);
            transition: all 0.3s ease;
        }
        .search-box-wrapper:focus-within {
            border-color: #00f2ff;
            box-shadow: 0 0 30px rgba(0, 242, 255, 0.3);
        }
        .search-input {
            background: transparent; border: none; outline: none;
            color: #fff; font-family: 'Rajdhani', sans-serif; font-weight: 700;
            font-size: 18px; width: 220px; text-transform: uppercase; letter-spacing: 1px;
        }
        .search-input::placeholder { color: rgba(0, 242, 255, 0.4); }
        .search-stats {
            margin-top: 5px; color: rgba(0, 242, 255, 0.6); font-family: 'Rajdhani', sans-serif;
            font-size: 12px; letter-spacing: 2px; text-align: right;
        }

        .bottom-hud {
            position: absolute; bottom: 40px; width: 100%; text-align: center; pointer-events: none; z-index: 10;
        }
        .hud-btn {
            display: inline-block; 
            font-family: 'Orbitron', sans-serif; font-size: 12px; color: #00f2ff; letter-spacing: 2px;
            padding: 10px 40px;
            background: linear-gradient(90deg, transparent 0%, rgba(0, 242, 255, 0.1) 50%, transparent 100%);
            border-top: 1px solid rgba(0, 242, 255, 0.5);
            border-bottom: 1px solid rgba(0, 242, 255, 0.5);
            text-shadow: 0 0 5px #00f2ff;
            position: relative;
        }
        .hud-btn::before, .hud-btn::after {
            content: ''; position: absolute; top: 50%; width: 5px; height: 5px; background: #00f2ff;
            transform: translateY(-50%) rotate(45deg);
        }
        .hud-btn::before { left: 10px; }
        .hud-btn::after { right: 10px; }
      `}</style>

      <div className="search-hud">
        <div className="search-box-wrapper">
            <input
                type="text"
                className="search-input"
                placeholder="SEARCH SYSTEM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="search-stats">
             TARGETS FOUND: {isFiltering ? filteredPlanets.length : PLANETS.length}
        </div>
      </div>

      <Canvas camera={{ position: [0, 80, 120], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" distance={200} />

        <EnhancedBackground />

        <group position={[0, 0, 0]}>
            <DataCoreSun />
        </group>

        {PLANETS.map((planet) => (
          <Planet 
            key={planet.id} 
            data={planet} 
            history={history} 
            isSearchMatch={checkMatch(planet.id)}
          />
        ))}

        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            maxDistance={300} 
            minDistance={40} 
            autoRotate={!searchQuery && !isFiltering} 
            autoRotateSpeed={0.3} 
            maxPolarAngle={Math.PI / 2.1} 
        />
      </Canvas>

      <div className="bottom-hud">
         <div className="hud-btn">
            拖动探索 · 点击进入
         </div>
      </div>
    </div>
  );
};

export default SolarSystem3D;
/* --- END OF FILE --- */