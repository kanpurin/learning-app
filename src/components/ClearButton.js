import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

function ClearButton({ onClear }) {
	return (
		<button
			className="btn btn-light"
			onClick={onClear}
			onMouseEnter={(e) => e.target.style.backgroundColor = 'lightgray'}
			onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
			style={{
				position: 'absolute',
				top: '2px',    // テキストエリア内に合わせて微調整
				right: '5px',  // テキストエリアの右端に寄せる
				backgroundColor: 'white',
				border: 'none',
				width: '24px',
				height: '24px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				borderRadius: '50%',
				cursor: 'pointer',
			}}
			>
			<FontAwesomeIcon icon={faTimes} style={{ color: 'gray', fontSize: '0.8em' }} />
		</button>
	);
}

export default ClearButton;
