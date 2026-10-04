import { useId } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const headPaths = {
  housecleaning: 'M65 58 81 38h56l18 20-8 52H73z',
  'vehicle-repair': 'M60 62q0-29 50-29t50 29l-10 48H70z',
  'knowledge-teacher': 'M64 56 87 36h46l23 20-10 54H74z',
  constructor: 'M56 57 78 34h65l22 23-8 58H64z',
  'soccer-coach': 'M66 61 84 40h53l18 21-9 49H75z',
  'art-assistant': 'M63 63 82 45h56l18 18-8 47H71z',
  delivery: 'M68 66q0-27 42-27t42 27l-8 42H76z',
}

const defaultBody = {
  torso: 'M68 133h84l15 82-27 18H80l-27-18z',
  chestPanel: 'M79 148h62l12 25-20 19H87l-20-19z',
  waist: 'M84 220h52l8 19H76z',
  shoulderLeft: [68, 136],
  shoulderRight: [152, 136],
  leftArm: 'M69 146 47 190l14 10 25-42z',
  rightArm: 'm151 146 22 44-14 10-25-42z',
  elbowLeft: [56, 197],
  elbowRight: [164, 197],
  leftForearm: 'm46 198-13 33 18 8 17-34z',
  rightForearm: 'm174 198 13 33-18 8-17-34z',
  hipLeft: [89, 240],
  hipRight: [131, 240],
  leftLeg: 'm80 246-12 55 19 5 12-47z',
  rightLeg: 'm140 246 12 55-19 5-12-47z',
  leftShin: 'm67 298-5 24h29l5-18z',
  rightShin: 'm153 298 5 24h-29l-5-18z',
  leftFoot: 'M59 321h36l-4 12H50z',
  rightFoot: 'M161 321h-36l4 12h41z',
  nameY: 205,
}

const bodyDefs = {
  housecleaning: {
    torso: 'M72 135h76l12 76-24 18H84l-24-18z',
    chestPanel: 'M86 150h48l10 22-16 16H92l-16-16z',
    waist: 'M88 222h44l6 16H82z',
    shoulderLeft: [68, 138],
    shoulderRight: [152, 138],
    leftArm: 'M69 148 51 190l12 8 22-42z',
    rightArm: 'm151 148 18 42-12 8-22-42z',
    elbowLeft: [59, 195],
    elbowRight: [161, 195],
    leftForearm: 'm50 196-11 30 17 7 15-30z',
    rightForearm: 'm170 196 11 30-17 7-15-30z',
    hipLeft: [95, 239],
    hipRight: [125, 239],
    leftLeg: 'm86 245-12 55 19 5 12-47z',
    rightLeg: 'm134 245 12 55-19 5-12-47z',
    leftShin: 'm73 298-5 24h29l5-18z',
    rightShin: 'm147 298 5 24h-29l-5-18z',
    leftFoot: 'M65 321h36l-4 12H56z',
    rightFoot: 'M155 321h-36l4 12h41z',
    nameY: 203,
  },
  'vehicle-repair': {
    torso: 'M62 130h92l18 78-30 18H74l-30-18z',
    chestPanel: 'M76 146h68l14 24-22 18H84l-22-18z',
    waist: 'M80 218h60l8 19H72z',
    shoulderLeft: [64, 136],
    shoulderRight: [152, 136],
    leftArm: 'M65 146 41 190l14 10 24-42z',
    rightArm: 'm151 146 24 44-14 10-24-42z',
    elbowLeft: [53, 197],
    elbowRight: [163, 197],
    leftForearm: 'm44 198-13 33 18 8 17-34z',
    rightForearm: 'm172 198 13 33-18 8-17-34z',
    hipLeft: [85, 238],
    hipRight: [135, 238],
    leftLeg: 'm76 244-12 55 19 5 12-47z',
    rightLeg: 'm144 244 12 55-19 5-12-47z',
    leftShin: 'm63 297-5 24h29l5-18z',
    rightShin: 'm157 297 5 24h-29l-5-18z',
    leftFoot: 'M55 320h36l-4 12H46z',
    rightFoot: 'M165 320h-36l4 12h41z',
    nameY: 202,
  },
  'knowledge-teacher': {
    torso: 'M74 128h72l10 88-20 16H84l-20-16z',
    chestPanel: 'M82 144h56l10 26-18 18H90l-18-18z',
    waist: 'M86 218h48l6 18H80z',
    shoulderLeft: [70, 134],
    shoulderRight: [150, 134],
    leftArm: 'M71 144 51 186l12 10 22-40z',
    rightArm: 'm149 144 20 42-12 10-22-40z',
    elbowLeft: [57, 197],
    elbowRight: [163, 197],
    leftForearm: 'm48 198-13 33 18 8 17-34z',
    rightForearm: 'm172 198 13 33-18 8-17-34z',
    hipLeft: [93, 237],
    hipRight: [127, 237],
    leftLeg: 'm84 243-12 55 19 5 12-47z',
    rightLeg: 'm136 243 12 55-19 5-12-47z',
    leftShin: 'm71 295-5 24h29l5-18z',
    rightShin: 'm149 295 5 24h-29l-5-18z',
    leftFoot: 'M63 318h36l-4 12H54z',
    rightFoot: 'M157 318h-36l4 12h41z',
    nameY: 200,
  },
  constructor: {
    torso: 'M60 128h100l18 86-32 20H74l-32-20z',
    chestPanel: 'M74 142h72l14 28-24 20H84l-24-20z',
    waist: 'M78 216h64l10 20H68z',
    shoulderLeft: [60, 134],
    shoulderRight: [160, 134],
    leftArm: 'M61 144 35 194l16 10 28-48z',
    rightArm: 'm159 144 30 50-16 10-28-48z',
    elbowLeft: [43, 199],
    elbowRight: [177, 199],
    leftForearm: 'm34 200-14 36 20 8 18-36z',
    rightForearm: 'm186 200 14 36-20 8-18-36z',
    hipLeft: [81, 237],
    hipRight: [139, 237],
    leftLeg: 'm72 243-14 58 22 6 14-50z',
    rightLeg: 'm148 243 14 58-22 6-14-50z',
    leftShin: 'm59 295-6 26h34l6-20z',
    rightShin: 'm161 295 6 26h-34l-6-20z',
    leftFoot: 'M51 318h40l-4 12H41z',
    rightFoot: 'M169 318h-40l4 12h46z',
    nameY: 198,
  },
  'soccer-coach': {
    torso: 'M70 132h88l14 80-28 18H84l-28-18z',
    chestPanel: 'M80 148h62l12 24-20 18H88l-20-18z',
    waist: 'M82 218h56l8 18H74z',
    shoulderLeft: [68, 136],
    shoulderRight: [156, 136],
    leftArm: 'M69 146 51 186l12 10 22-40z',
    rightArm: 'm155 146 20 42-12 10-22-40z',
    elbowLeft: [53, 197],
    elbowRight: [171, 197],
    leftForearm: 'm44 198-13 33 18 8 17-34z',
    rightForearm: 'm180 198 13 33-18 8-17-34z',
    hipLeft: [87, 237],
    hipRight: [133, 237],
    leftLeg: 'm78 243-12 55 19 5 12-47z',
    rightLeg: 'm142 243 12 55-19 5-12-47z',
    leftShin: 'm65 295-5 24h29l5-18z',
    rightShin: 'm155 295 5 24h-29l-5-18z',
    leftFoot: 'M57 318h36l-4 12H48z',
    rightFoot: 'M163 318h-36l4 12h41z',
    nameY: 202,
  },
  'art-assistant': {
    torso: 'M70 134h84l16 78-24 20H78l-24-20z',
    chestPanel: 'M78 146h64l14 24-20 18H88l-20-18z',
    waist: 'M84 218h52l8 18H76z',
    shoulderLeft: [68, 136],
    shoulderRight: [156, 136],
    leftArm: 'M69 146 45 192l14 12 26-46z',
    rightArm: 'm155 146 24 46-14 12-26-46z',
    elbowLeft: [57, 197],
    elbowRight: [167, 197],
    leftForearm: 'm48 198-13 33 18 8 17-34z',
    rightForearm: 'm176 198 13 33-18 8-17-34z',
    hipLeft: [89, 237],
    hipRight: [131, 237],
    leftLeg: 'm80 243-12 55 19 5 12-47z',
    rightLeg: 'm140 243 12 55-19 5-12-47z',
    leftShin: 'm67 295-5 24h29l5-18z',
    rightShin: 'm153 295 5 24h-29l-5-18z',
    leftFoot: 'M59 318h36l-4 12H50z',
    rightFoot: 'M161 318h-36l4 12h41z',
    nameY: 201,
  },
  delivery: {
    torso: 'M80 138h60l10 68-18 14H88l-18-14z',
    chestPanel: 'M88 152h44l8 18-14 12H94l-14-12z',
    waist: 'M90 216h40l4 12H86z',
    shoulderLeft: [80, 140],
    shoulderRight: [140, 140],
    leftArm: 'M81 150 65 182l10 8 16-32z',
    rightArm: 'm139 150 16 34-10 8-16-32z',
    elbowLeft: [72, 187],
    elbowRight: [148, 187],
    leftForearm: 'm63 188-8 22 13 5 10-22z',
    rightForearm: 'm157 188 8 22-13 5-10-22z',
    nameY: 196,
  },
}

function getBody(profile) {
  return { ...defaultBody, ...(bodyDefs[profile] || {}) }
}

function SpecialtyRig({ profile }) {
  if (profile === 'housecleaning') {
    return (
      <>
        <path className="rig-line" d="M48 185 40 115" />
        <path className="rig-leaf" d="m32 118 8-22 14 4-8 22z" />
        <rect className="rig-panel" x="36" y="108" width="8" height="14" rx="2" />
      </>
    )
  }
  if (profile === 'vehicle-repair') {
    return (
      <>
        <circle className="rig-ring" cx="165" cy="95" r="22" />
        <path className="rig-line" d="M165 73v45M143 95h45" />
        <circle className="rig-core" cx="165" cy="95" r="4" />
      </>
    )
  }
  if (profile === 'knowledge-teacher') {
    return (
      <>
        <rect className="rig-panel" x="38" y="82" width="32" height="24" rx="3" />
        <path className="rig-line" d="M44 92h20M44 100h16" />
        <path className="rig-glow" d="M42 86h24" />
      </>
    )
  }
  if (profile === 'constructor') {
    return (
      <>
        <path className="rig-panel" d="m150 90 20-8 8 16-20 8z" />
        <path className="rig-line" d="m162 112 22 22" />
        <circle className="rig-core" cx="175" cy="120" r="4" />
      </>
    )
  }
  if (profile === 'soccer-coach') {
    return (
      <>
        <circle className="rig-ring" cx="48" cy="95" r="16" />
        <path className="rig-line" d="M48 79v32M32 95h32" />
        <circle className="rig-core" cx="165" cy="95" r="5" />
      </>
    )
  }
  if (profile === 'art-assistant') {
    return (
      <>
        <path className="rig-line" d="M162 128 150 83" />
        <path className="rig-leaf" d="m142 86 8-10 8 10z" />
        <ellipse className="rig-panel" cx="168" cy="108" rx="14" ry="10" />
      </>
    )
  }
  return (
    <>
      <rect className="rig-panel" x="145" y="82" width="28" height="28" rx="3" />
      <path className="rig-line" d="M150 90h18M150 98h18M150 106h12" />
      <circle className="rig-core" cx="175" cy="122" r="5" />
    </>
  )
}

function IntegratedDetails({ member }) {
  const { profile, trim, core, plate } = member

  if (profile === 'housecleaning') {
    return (
      <g className="mech-role-details">
        <path fill="rgba(255,255,255,0.18)" stroke={trim} strokeWidth="2" d="M86 188h48v40H86z" />
        <path fill="none" stroke={trim} strokeWidth="2" d="M92 202h36M92 210h28" />
      </g>
    )
  }

  if (profile === 'vehicle-repair') {
    return (
      <g className="mech-role-details">
        <path fill={core} d="M82 68h56l-2 12H84z" />
        <path fill="none" stroke={trim} strokeWidth="3" d="M76 74h68" />
        <path fill={plate} stroke={trim} strokeWidth="2" d="M160 126l20-8v32l-20 8z" />
      </g>
    )
  }

  if (profile === 'knowledge-teacher') {
    return (
      <g className="mech-role-details">
        <circle fill="none" stroke={trim} strokeWidth="2" cx="96" cy="80" r="12" />
        <circle fill="none" stroke={trim} strokeWidth="2" cx="124" cy="80" r="12" />
        <path fill={trim} d="M96 130h28l-14 12z" />
        <path fill={core} d="M92 132h36l-18 14z" />
      </g>
    )
  }

  if (profile === 'constructor') {
    return (
      <g className="mech-role-details">
        <path fill={trim} d="M70 50h80l-6-14H76z" />
        <path fill={trim} opacity="0.85" d="M84 36h52v10H84z" />
        <path fill="none" stroke={trim} strokeWidth="3" d="M80 216h60M86 216v14M110 216v14M134 216v14" />
      </g>
    )
  }

  if (profile === 'soccer-coach') {
    return (
      <g className="mech-role-details">
        <path fill={trim} d="M74 56h72l6 10H68z" />
        <path fill={trim} d="M68 64h84v6H68z" />
        <circle fill={core} cx="110" cy="124" r="5" />
        <path fill="none" stroke={trim} strokeWidth="3" d="M88 160v50M132 160v50" />
      </g>
    )
  }

  if (profile === 'art-assistant') {
    return (
      <g className="mech-role-details">
        <path fill={trim} d="M80 50q30-18 60 0l-6 12H86z" />
        <circle fill={core} cx="70" cy="150" r="5" />
        <circle fill={core} cx="150" cy="180" r="4" />
        <circle fill={core} cx="120" cy="230" r="6" />
      </g>
    )
  }

  if (profile === 'delivery') {
    return (
      <g className="mech-role-details">
        <path fill={core} d="M84 68h52l-4 14H88z" />
        <rect fill={trim} x="94" y="145" width="32" height="38" rx="3" />
        <path fill="none" stroke={trim} strokeWidth="2" d="M94 145l16-30 16 30" />
      </g>
    )
  }

  return null
}

export default function MechFigure({ member, selected, onSelect, dancing, danceToken }) {
  const uid = useId().replace(/:/g, '')
  const plateGradient = `plate-${uid}`
  const coreGradient = `core-${uid}`
  const glow = `glow-${uid}`
  const body = getBody(member.profile)
  const style = {
    '--x': `${member.position.x}%`,
    '--y': `${member.position.y}%`,
    '--xp': `${member.position.xp}%`,
    '--yp': `${member.position.yp}%`,
    '--scale': member.position.scale,
    '--z': member.position.z,
    '--plate': member.plate,
    '--trim': member.trim,
    '--core': member.core,
  }

  return (
    <button
      className={`mech-figure mech-${member.profile} ${selected ? 'is-selected' : ''} ${dancing ? 'is-dancing' : ''} dance-${danceToken}`}
      style={style}
      type="button"
      data-robot-trigger
      data-robot-id={member.id}
      aria-label={`${member.name}, ${member.role}`}
      aria-expanded={selected}
      aria-controls="member-intro"
      onClick={(event) => {
        event.stopPropagation()
        onSelect(member, event.currentTarget)
      }}
    >
      <span className="mech-shadow" />
      <svg className="mech-svg" viewBox="0 0 220 340" aria-hidden="true">
        <defs>
          <linearGradient id={plateGradient} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#dce9f2" />
            <stop offset="0.13" stopColor={member.plate} />
            <stop offset="0.62" stopColor="#334554" />
            <stop offset="1" stopColor="#101a23" />
          </linearGradient>
          <radialGradient id={coreGradient}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.24" stopColor={member.core} />
            <stop offset="1" stopColor={member.trim} stopOpacity="0.15" />
          </radialGradient>
          <filter id={glow} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="mech-character">
          <path className="mech-antenna" d="M110 36V16" />
          <circle className="mech-signal" cx="110" cy="13" r="5" />
          <SpecialtyRig profile={member.profile} />
          <path className="mech-head" d={headPaths[member.profile]} fill={`url(#${plateGradient})`} />
          <path className="mech-forehead" d="M83 58h54l9 14H74z" />
          <path className="mech-optics" d="M80 73h60l-7 15H87z" filter={`url(#${glow})`} />
          <path className="mech-vent" d="M91 99h38l-8 14H99z" />
          <circle className="mech-neck" cx="110" cy="119" r="11" />
          <path className="mech-arm mech-left-arm" d={body.leftArm} />
          <path className="mech-arm mech-right-arm" d={body.rightArm} />
          <circle className="mech-joint" cx={body.elbowLeft[0]} cy={body.elbowLeft[1]} r="10" />
          <circle className="mech-joint" cx={body.elbowRight[0]} cy={body.elbowRight[1]} r="10" />
          <path className="mech-forearm" d={body.leftForearm} />
          <path className="mech-forearm" d={body.rightForearm} />
          <path className="mech-torso" d={body.torso} fill={`url(#${plateGradient})`} />
          <path className="mech-chest-panel" d={body.chestPanel} />
          <circle className="mech-core" cx="110" cy="171" r="16" fill={`url(#${coreGradient})`} filter={`url(#${glow})`} />
          <path className="mech-core-frame" d="m110 148 20 12v23l-20 12-20-12v-23z" />
          <text className="mech-name" x="110" y={clamp(body.nameY, 190, 215)} textAnchor="middle">{member.name}</text>
          <path className="mech-waist" d={body.waist} />
          <circle className="mech-joint" cx={body.hipLeft[0]} cy={body.hipLeft[1]} r="13" />
          <circle className="mech-joint" cx={body.hipRight[0]} cy={body.hipRight[1]} r="13" />
          {member.profile === 'delivery' ? null : (
            <>
              <path className="mech-leg" d={body.leftLeg} />
              <path className="mech-leg" d={body.rightLeg} />
              <path className="mech-shin" d={body.leftShin} />
              <path className="mech-shin" d={body.rightShin} />
              <path className="mech-foot" d={body.leftFoot} />
              <path className="mech-foot" d={body.rightFoot} />
            </>
          )}
          <IntegratedDetails member={member} />
          <path className="mech-edge-light" d="M75 143h-9l-14 25m90-25h10l14 25M80 226h59" />
        </g>
      </svg>
    </button>
  )
}
